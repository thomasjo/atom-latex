/** @babel */

import _ from 'lodash'
import { shell } from 'electron'
import fs from 'fs-plus'
import path from 'path'
import BuilderRegistry from './builder-registry'
import { getEditorDetails, heredoc } from './werkzeug'

export default class Composer {
  constructor () {
    this.builderRegistry = new BuilderRegistry()
    this.configChange = atom.config.onDidChange('latex', () => {
      this.rebuildCompleted = new Set()
    })
  }

  destroy () {
  }

  initializeBuild (filePath) {
    let state = {
      rootFilePath: this.resolveRootFilePath(filePath)
    }

    state.builder = this.getBuilder(state.rootFilePath)
    if (!state.builder) {
      latex.log.warning(`No registered LaTeX builder can process ${filePath}.`)
      return state
    }

    if (Object.getPrototypeOf(state.builder).constructor.name === 'TexifyBuilder') {
      // -------------------------------------------------------------
      // TODO: Remove this whole block when texify support is removed.
      // -------------------------------------------------------------
      const message = `LaTeX: The texify builder has been deprecated`
      const description = heredoc(`
        Support for the \`texify\` builder has been deprecated in favor of \`latexmk\`, and will be
        removed soon.`)

      const title = 'How to use latexmk with MiKTeX'
      const url = 'https://github.com/thomasjo/atom-latex/wiki/Using-latexmk-with-MiKTeX'
      const openUrl = (event) => {
        // NOTE: Horrible hack due to a bug in atom/notifications module...
        const element = event.target.parentElement.parentElement.parentElement.parentElement
        const notification = element.getModel()
        notification.dismiss()

        shell.openExternal(url)
      }

      atom.notifications.addWarning(message, {
        dismissable: true, description, buttons: [{ text: title, onDidClick: openUrl }]
      })
    }

    state.jobnames = state.builder.getJobNamesFromMagic(state.rootFilePath)

    return state
  }

  async build (shouldRebuild) {
    latex.process.killChildProcesses()

    const { editor, filePath } = getEditorDetails()

    if (!filePath) {
      latex.log.warning('File needs to be saved to disk before it can be TeXified.')
      return false
    }

    if (editor.isModified()) {
      editor.save() // TODO: Make this configurable?
    }

    const { builder, rootFilePath, jobnames } = this.initializeBuild(filePath)
    if (!builder) return false

    if (this.rebuildCompleted && !this.rebuildCompleted.has(rootFilePath)) {
      shouldRebuild = true
      this.rebuildCompleted.add(rootFilePath)
    }

    const label = shouldRebuild ? 'LaTeX Rebuild' : 'LaTeX Build'

    latex.setStatus(label, 'highlight', 'sync', true, 'Click to kill LaTeX build.', () => latex.process.killChildProcesses())
    latex.log.group(label)

    const jobs = jobnames.map(jobname => this.buildJob(builder, rootFilePath, jobname, shouldRebuild))

    await Promise.all(jobs)

    latex.log.groupEnd()
  }

  async buildJob (builder, rootFilePath, jobname, shouldRebuild) {
    try {
      const statusCode = await builder.run(rootFilePath, jobname, shouldRebuild)
      const result = builder.parseLogAndFdbFiles(rootFilePath, jobname)

      if (result) {
        for (const message of result.messages) {
          latex.log.showMessage(message)
        }
      }

      if (statusCode > 0 || !result || !result.outputFilePath) {
        this.showError(result)
      } else {
        if (this.shouldMoveResult()) {
          this.moveResult(result, rootFilePath)
        }
        this.showResult(result)
      }
    } catch (error) {
      latex.log.error(error.message)
    }
  }

  async sync () {
    const { filePath, lineNumber } = getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return
    }

    const { builder, rootFilePath, jobnames } = this.initializeBuild(filePath)
    if (!builder) return false

    const jobs = jobnames.map(jobname => this.syncJob(filePath, lineNumber, builder, rootFilePath, jobname))

    return await Promise.all(jobs)
  }

  async syncJob (filePath, lineNumber, builder, rootFilePath, jobname) {
    const outputFilePath = this.resolveOutputFilePath(builder, rootFilePath, jobname)
    if (!outputFilePath) {
      latex.log.warning('Could not resolve path to output file associated with the current file.')
      return
    }

    const opener = latex.getOpener()
    if (opener) {
      return await opener.open(outputFilePath, filePath, lineNumber)
    }
  }

  async clean () {
    const { filePath } = getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return false
    }

    const { rootFilePath, jobnames } = this.initializeBuild(filePath)

    const jobs = jobnames.map(jobname => this.cleanJob(rootFilePath, jobname))

    return _.flatten(await Promise.all(jobs))
  }

  async cleanJob (rootFilePath, jobname) {
    let { dir, name } = path.parse(rootFilePath)

    const outdir = atom.config.get('latex.outputDirectory')
    if (outdir) {
      dir = path.join(dir, outdir)
    }

    if (jobname) {
      name = jobname
    }

    const cleanExtensions = atom.config.get('latex.cleanExtensions')

    const exts = cleanExtensions.map(async ext => new Promise(resolve => {
      const filePath = path.format({ dir, name, ext })
      fs.remove(filePath, error => resolve({ filePath, error }))
    }))

    return await Promise.all(exts)
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

  resolveOutputFilePath (builder, rootFilePath, jobname) {
    const label = `${rootFilePath}|${jobname}`

    if (this.outputLookup.has(label)) {
      return this.outputLookup.get(label)
    }

    const result = builder.parseLogAndFdbFiles(rootFilePath, jobname)
    if (!result || !result.outputFilePath) {
      latex.log.warning('Log file parsing failed!')
      return null
    }

    let outputFilePath = result.outputFilePath
    if (this.shouldMoveResult()) {
      outputFilePath = this.alterParentPath(rootFilePath, outputFilePath)
    }
    this.outputLookup.set(label, outputFilePath)

    return outputFilePath
  }

  async showResult (result) {
    if (!this.shouldOpenResult()) { return }

    const opener = latex.getOpener()
    if (opener) {
      const { filePath, lineNumber } = getEditorDetails()
      await opener.open(result.outputFilePath, filePath, lineNumber)
    }
  }

  showError (result) {
    if (!result) {
      latex.log.error('Parsing of log files failed.')
    } else if (!result.outputFilePath) {
      latex.log.error('No output file detected.')
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
