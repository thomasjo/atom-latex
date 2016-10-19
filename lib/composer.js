/** @babel */

import _ from 'lodash'
import { shell } from 'electron'
import fs from 'fs-plus'
import path from 'path'
import BuilderRegistry from './builder-registry'
import { getEditorDetails, heredoc, replacePropertiesInString } from './werkzeug'
import minimatch from 'minimatch'
import glob from 'glob'

export default class Composer {
  outputLookup = new Map()
  builderRegistry = new BuilderRegistry()

  constructor () {
    this.configChange = atom.config.onDidChange('latex', () => {
      this.rebuildCompleted = new Set()
    })
    this.checkEnvironment()
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
        latex.log.addMessages(result.messages)
      }

      if (statusCode > 0 || !result || !result.outputFilePath) {
        this.showError(result)
      } else {
        if (this.shouldMoveResult(builder, rootFilePath)) {
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

    latex.log.group('LaTeX Clean')

    const { builder, rootFilePath, jobnames } = this.initializeBuild(filePath)
    if (!builder) return false

    const jobs = jobnames.map(jobname => this.cleanJob(builder, rootFilePath, jobname))

    await Promise.all(jobs)

    latex.log.groupEnd()
  }

  async cleanJob (builder, rootFilePath, jobname) {
    const rootPath = path.dirname(rootFilePath)
    const generatedFiles = this.getGeneratedFileList(builder, rootFilePath, jobname)
    let files = new Set()

    const patterns = this.getCleanPatterns(builder, rootFilePath, jobname)

    for (const pattern of patterns) {
      const absolutePattern = path.join(rootPath, pattern)
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

    const fileNames = Array.from(files.values()).map(file => path.basename(file)).join(', ')
    latex.log.info('Cleaned: ' + fileNames)

    for (const file of files.values()) {
      fs.removeSync(file)
    }
  }

  getCleanPatterns (builder, rootFilePath, jobname) {
    const { name, ext } = path.parse(rootFilePath)
    const outputDirectory = builder.getOutputDirectory()
    const properties = {
      output_dir: outputDirectory ? outputDirectory + path.sep : '',
      jobname: jobname || name,
      name,
      ext
    }
    const patterns = atom.config.get('latex.cleanPatterns')

    return _.map(patterns, pattern => path.normalize(replacePropertiesInString(pattern, properties)))
  }

  getGeneratedFileList (builder, rootFilePath, jobname) {
    const { dir, name } = path.parse(rootFilePath)
    const fdb = builder.parseFdbFile(rootFilePath, jobname)

    const outputDirectory = builder.getOutputDirectory()
    const pattern = path.join(dir, outputDirectory, `${jobname || name}*`)
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
    if (this.shouldMoveResult(builder, rootFilePath)) {
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

  shouldMoveResult (builder, rootFilePath) {
    const moveResult = atom.config.get('latex.moveResultToSourceDirectory')
    const outputDirectory = builder.getOutputDirectory(rootFilePath)
    return moveResult && outputDirectory.length > 0
  }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }

  async checkEnvironment () {
    // TODO: remove after grace period
    this.checkCleanExtensions()
  }

  checkCleanExtensions () {
    const cleanExtensions = atom.config.get('latex.cleanExtensions')
    if (!cleanExtensions) return

    let cleanPatterns = atom.config.get('latex.cleanPatterns')
    const defaultExtensions = [
      '.aux', '.bbl', '.blg', '.fdb_latexmk', '.fls', '.lof', '.log',
      '.lol', '.lot', '.nav', '.out', '.pdf', '.snm', '.synctex.gz', '.toc'
    ]

    atom.config.unset('latex.cleanExtensions')

    const removedExtensions = _.difference(defaultExtensions, cleanExtensions)
    cleanPatterns = _.difference(cleanPatterns, removedExtensions.map(extension => `**/*${extension}`))

    const addedExtensions = _.difference(cleanExtensions, defaultExtensions)
    cleanPatterns = _.union(cleanPatterns, addedExtensions.map(extension => `**/*${extension}`))

    atom.config.set('latex.cleanPatterns', cleanPatterns)
    const message = 'LaTeX: The "latex:clean" command has changed'
    const description = heredoc(`
      Your custom extensions in the \`Clean Extensions\` settings have
      been migrated to the new setting \`Clean Patterns\`.`)
    atom.notifications.addInfo(message, { description })
  }
}
