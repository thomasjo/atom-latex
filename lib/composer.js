'use babel'

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import BuilderRegistry from './builder-registry'

export default class Composer {
  constructor () {
    this.builderRegistry = new BuilderRegistry()
  }

  destroy () {
    this.destroyProgressIndicator()
    this.destroyErrorIndicator()
    this.destroyErrorMarkers()
  }

  async build () {
    const {editor, filePath} = this.getEditorDetails()

    if (!filePath) {
      latex.log.warning('File needs to be saved to disk before it can be TeXified.')
      return Promise.reject(false)
    }

    const builder = this.getBuilder(filePath)
    if (builder == null) {
      latex.log.warning(`No registered LaTeX builder can process ${filePath}.`)
      return Promise.reject(false)
    }

    if (editor.isModified()) {
      editor.save() // TODO: Make this configurable?
    }

    this.destroyErrorMarkers()
    this.destroyErrorIndicator()
    this.showProgressIndicator()

    return new Promise(async (resolve, reject) => {
      latex.log.group('LaTeX Build')
      const rootFilePath = this.resolveRootFilePath(filePath)
      let statusCode, result
      let jobnames = builder.getJobNamesFromMagic(rootFilePath)

      try {
        for (const jobname of jobnames) {
          statusCode = await builder.run(rootFilePath, jobname)
          result = builder.parseLogFile(rootFilePath, jobname)

          if (result) {
            for (const message of result.messages) {
              latex.log.showMessage(message)
            }
          }

          if (statusCode > 0 || !result || !result.outputFilePath) {
            this.showError(statusCode, result, builder)
            reject(statusCode)
          }

          if (this.shouldMoveResult()) {
            this.moveResult(result, rootFilePath)
          }

          this.showResult(result)
          resolve(statusCode)
        }
      } catch (error) {
        console.error(error.message)
        reject(error.message)
      } finally {
        this.destroyProgressIndicator()
        latex.log.groupEnd()
      }
    })
  }

  sync () {
    const {filePath, lineNumber} = this.getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return
    }

    const outputFilePath = this.resolveOutputFilePath(filePath)
    if (!outputFilePath) {
      latex.log.warning('Could not resolve path to output file associated with the current file.')
      return
    }

    const opener = latex.getOpener()
    if (opener) {
      opener.open(outputFilePath, filePath, lineNumber)
    }
  }

  async clean () {
    const {filePath} = this.getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return Promise.reject()
    }

    const rootFilePath = this.resolveRootFilePath(filePath)
    let rootPath = path.dirname(rootFilePath)

    let outdir = atom.config.get('latex.outputDirectory')
    if (outdir) {
      rootPath = path.join(rootPath, outdir)
    }

    let rootFile = path.basename(rootFilePath)
    rootFile = rootFile.substring(0, rootFile.lastIndexOf('.'))

    const cleanExtensions = atom.config.get('latex.cleanExtensions')
    return Promise.all(cleanExtensions.map(async (extension) => {
      const candidatePath = path.join(rootPath, rootFile + extension)
      return new Promise(async (resolve) => {
        fs.remove(candidatePath, (error) => {
          resolve({filePath: candidatePath, error: error})
        })
      })
    }))
  }

  setStatusBar (statusBar) {
    this.statusBar = statusBar
  }

  moveResult (result, filePath) {
    const originalOutputFilePath = result.outputFilePath
    result.outputFilePath = this.alterParentPath(filePath, originalOutputFilePath)
    if (fs.existsSync(originalOutputFilePath)) {
      fs.removeSync(result.outputFilePath)
      fs.moveSync(originalOutputFilePath, result.outputFilePath)
    }

    const originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, '.synctex.gz')
    if (fs.existsSync(originalSyncFilePath)) {
      const syncFilePath = this.alterParentPath(filePath, originalSyncFilePath)
      fs.removeSync(syncFilePath)
      fs.moveSync(originalSyncFilePath, syncFilePath)
    }
  }

  resolveRootFilePath (filePath) {
    const MasterTexFinder = require('./master-tex-finder')
    const finder = new MasterTexFinder(filePath)
    return finder.getMasterTexPath()
  }

  resolveOutputFilePath (filePath) {
    let outputFilePath, rootFilePath

    if (this.outputLookup) {
      outputFilePath = this.outputLookup[filePath]
    }

    if (!outputFilePath) {
      rootFilePath = this.resolveRootFilePath(filePath)

      const builder = latex.getBuilder()
      const result = builder.parseLogFile(rootFilePath)
      if (!result || !result.outputFilePath) {
        latex.log.warning('Log file parsing failed!')
        return null
      }

      this.outputLookup = this.outputLookup || {}
      this.outputLookup[filePath] = result.outputFilePath
    }

    if (this.shouldMoveResult()) {
      outputFilePath = this.alterParentPath(rootFilePath, outputFilePath)
    }

    return outputFilePath
  }

  showResult (result) {
    if (!this.shouldOpenResult()) { return }

    const opener = latex.getOpener()
    if (opener) {
      const {filePath, lineNumber} = this.getEditorDetails()
      opener.open(result.outputFilePath, filePath, lineNumber)
    }
  }

  showError (statusCode, result, builder) {
    this.showErrorIndicator(result)
//    if (!this.linterIndie) this.showErrorMarkers(result)
    latex.log.error(`TeXification failed with status code ${statusCode}`)
  }

  showProgressIndicator () {
    if (!this.statusBar) { return null }
    if (this.indicator) { return this.indicator }

    const ProgressIndicator = require('./status-bar/progress-indicator')
    this.indicator = new ProgressIndicator()
    this.statusBar.addRightTile({
      item: this.indicator,
      priority: 9001
    })
  }

  showErrorIndicator (result) {
    if (!this.statusBar) { return null }
    if (this.errorIndicator) { return this.errorIndicator }

    const ErrorIndicator = require('./status-bar/error-indicator')
    this.errorIndicator = new ErrorIndicator(result)
    this.statusBar.addRightTile({
      item: this.errorIndicator,
      priority: 9001
    })
  }

  showErrorMarkers (result) {
    if (this.errorMarkers && this.errorMarkers.length > 0) { this.destroyErrorMarkers() }
    const editors = this.getAllEditors()
    this.errorMarkers = []
    const ErrorMarker = require('./error-marker')
    for (let editor of editors) {
      if (editor.getPath()) {
        let messages = _.filter(result.messages, message => {
          return editor.getPath().includes(message.filePath)
        })
        if (messages.length) {
          this.errorMarkers.push(new ErrorMarker(editor, messages))
        }
      }
    }
  }

  destroyProgressIndicator () {
    if (this.indicator) {
      this.indicator.element.remove()
      this.indicator = null
    }
  }

  destroyErrorIndicator () {
    if (this.errorIndicator) {
      this.errorIndicator.element.remove()
      this.errorIndicator = null
    }
  }

  destroyErrorMarkers () {
    if (this.errorMarkers) {
      for (let errorMarker of this.errorMarkers) {
        errorMarker.clear()
        errorMarker = null
      }
      this.errorMarkers = []
    }
  }

  isTexFile (filePath) {
    // TODO: Improve will suffice for the time being.
    return !filePath || filePath.search(/\.(tex|lhs)$/) > 0
  }

  getBuilder (filePath) {
    const BuilderImpl = this.builderRegistry.getBuilder(filePath)
    return (BuilderImpl != null) ? new BuilderImpl() : null
  }

  getEditorDetails () {
    const editor = atom.workspace.getActiveTextEditor()
    let filePath, lineNumber
    if (editor) {
      filePath = editor.getPath()
      lineNumber = editor.getCursorBufferPosition().row + 1
    }

    return {
      editor: editor,
      filePath: filePath,
      lineNumber: lineNumber
    }
  }

  getAllEditors () {
    return atom.workspace.getTextEditors()
  }

  alterParentPath (targetPath, originalPath) {
    const targetDir = path.dirname(targetPath)
    return path.join(targetDir, path.basename(originalPath))
  }

  shouldMoveResult () {
    const moveResult = atom.config.get('latex.moveResultToSourceDirectory')
    const outputDirectory = atom.config.get('latex.outputDirectory')
    return moveResult && outputDirectory.length > 0
  }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }
}
