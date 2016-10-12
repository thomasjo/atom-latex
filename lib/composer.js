/** @babel */

import _ from 'lodash'
import { shell } from 'electron'
import fs from 'fs-plus'
import path from 'path'
import BuilderRegistry from './builder-registry'
import { getEditorDetails, heredoc, replaceProperitiesInString } from './werkzeug'
import minimatch from 'minimatch'
import glob from 'glob'

export default class Composer {
  outputLookup = new Map()
  builderRegistry = new BuilderRegistry()

  constructor () {
    this.configChange = atom.config.onDidChange('latex', () => {
      this.rebuildCompleted = new Set()
    })
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

    latex.status.show(label, 'highlight', 'sync', true, 'Click to kill LaTeX build.', () => latex.process.killChildProcesses())
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
        // Cache the output file path for sync
        this.outputLookup.set({ rootFilePath, jobname }, result.outputFilePath)
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

    const { builder, rootFilePath, jobnames } = this.initializeBuild(filePath)
    if (!builder) return false

    const jobs = jobnames.map(jobname => this.cleanJob(builder, rootFilePath, jobname))

    return _.flatten(await Promise.all(jobs))
  }

  async cleanJob (builder, rootFilePath, jobname) {
    const rootPath = path.dirname(rootFilePath)
    const generatedFiles = this.getGeneratedFileList(builder, rootFilePath, jobname)
    let files = new Set()

    const patterns = this.getCleanPatterns(builder, rootFilePath, jobname)

    for (const pattern of patterns) {
      const absolutePattern = path.join(rootPath, pattern)
      console.log(`${pattern} -> ${absolutePattern}`)
      // If the original pattern is absolute then we use it as a globbing pattern
      // after we join it to the root, otherwise we use it against the list of
      // generated files.
      if (pattern[0] === path.sep) {
        for (const file of glob.sync(absolutePattern)) {
          files.add(path.normalize(file))
        }
      } else {
        for (const file of generatedFiles.values()) {
          if (minimatch(file, absolutePattern)) {
            files.add(file)
          }
        }
      }
    }

    for (const file of files.values()) {
      fs.removeSync(file)
    }
  }

  getCleanPatterns (builder, rootFilePath, jobname) {
    const { name, ext } = path.parse(rootFilePath)
    const output = atom.config.get('latex.outputDirectory')
    const properties = {
      output: output ? output + path.sep : '',
      jobname: jobname || name,
      name,
      ext
    }
    const patterns = atom.config.get('latex.cleanPatterns')

    return _.map(patterns, pattern => path.normalize(replaceProperitiesInString(pattern, properties)))
  }

  getGeneratedFileList (builder, rootFilePath, jobname) {
    const { dir, name } = path.parse(rootFilePath)
    const fdb = builder.parseFdbFile(rootFilePath, jobname)

    const output = atom.config.get('latex.outputDirectory')
    const pattern = path.join(dir, output, `${name}*`)
    const files = new Set(glob.sync(pattern))

    if (fdb) {
      for (const file of _.flatten(_.values(fdb))) {
        files.add(path.resolve(dir, file))
      }
    }

    return files
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
    const label = { rootFilePath, jobname }

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
    return !filePath || filePath.search(/\.(tex|lhs|[rs]nw)$/i) > 0
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
