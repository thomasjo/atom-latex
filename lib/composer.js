/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import { getEditorDetails, replacePropertiesInString } from './werkzeug'
import minimatch from 'minimatch'
import glob from 'glob'
import { CompositeDisposable, Disposable } from 'atom'
import BuildState from './build-state'
import MagicParser from './parsers/magic-parser'

export default class Composer extends Disposable {
  disposables = new CompositeDisposable()
  cachedBuildStates = new Map()

  constructor () {
    super(() => this.disposables.dispose())
    this.disposables.add(atom.config.onDidChange('latex', () => {
      this.rebuildCompleted = new Set()
    }))
  }

  initializeBuild (filePath, allowCached = false) {
    let state

    if (allowCached && this.cachedBuildStates.has(filePath)) {
      state = this.cachedBuildStates.get(filePath)
    } else {
      state = new BuildState(filePath)
      this.initializeBuildStateFromConfig(state)
      this.initializeBuildStateFromMagic(state)
      // Check again in case there was a root comment
      const masterFilePath = state.getFilePath()
      if (filePath !== masterFilePath) {
        if (allowCached && this.cachedBuildStates.has(masterFilePath)) {
          state = this.cachedBuildStates.get(masterFilePath)
        }
        state.addSubfile(filePath)
      }
      this.cacheBuildState(state)
    }

    const builder = latex.builderRegistry.getBuilder(state.getFilePath())
    if (!builder) {
      latex.log.warning(`No registered LaTeX builder can process ${state.getFilePath()}.`)
      return state
    }

    return { state, builder }
  }

  cacheBuildState (state) {
    const filePath = state.getFilePath()
    if (this.cachedBuildStates.has(filePath)) {
      const oldState = this.cachedBuildStates.get(filePath)
      for (const subfile of oldState.getSubfiles()) {
        this.cachedBuildStates.delete(subfile)
      }
      this.cachedBuildStates.delete(filePath)
    }

    this.cachedBuildStates.set(filePath, state)
    for (const subfile of state.getSubfiles()) {
      this.cachedBuildStates.set(subfile, state)
    }
  }

  initializeBuildStateFromConfig (state) {
    state.setEnableSynctex(atom.config.get('latex.enableSynctex'))
    state.setEnableShellEscape(atom.config.get('latex.enableShellEscape'))
    state.setEnableExtendedBuildMode(atom.config.get('latex.enableExtendedBuildMode'))
    state.setEngine(atom.config.get('latex.customEngine') || atom.config.get('latex.engine'))
    state.setOutputDirectory(atom.config.get('latex.outputDirectory'))
    state.setOutputFormat(atom.config.get('latex.outputFormat'))
    state.setProducer(atom.config.get('latex.producer'))
  }

  initializeBuildStateFromProperties (state, properties) {
    if (!properties) return

    if (properties.enableSynctex) {
      state.setEnableSynctex(!!properties.enableSynctex)
    }

    if (properties.enableShellEscape) {
      state.setEnableShellEscape(!!properties.enableShellEscape)
    }

    if (properties.enableExtendedBuildMode) {
      state.setEnableExtendedBuildMode(!!properties.enableExtendedBuildMode)
    }

    if (properties.jobnames) {
      // Look for a string in case it is from magic properties
      state.setJobnames(typeof properties.jobnames === 'string' ? properties.jobnames.split(/[,\s]+/) : properties)
    } else if (properties.jobname) {
      // jobname is for compatibility with Sublime
      state.setJobnames([properties.jobname])
    }

    if (properties.engine) {
      // engine is to maintain consistency with our setting schema
      state.setEngine(properties.engine)
    } else if (properties.program) {
      // program is for compatibility with magic comments
      state.setEngine(properties.program)
    }

    if (properties.outputFormat) {
      // outputFormat is to maintain consistency with our setting schema
      state.setOutputFormat(properties.outputFormat)
    } else if (properties.format) {
      // format is form compatibility with magic comments
      state.setOutputFormat(properties.format)
    }

    if (properties.outputDirectory) {
      // outputDirectory is to maintain consistency with our setting schema
      state.setOutputDirectory(properties.outputDirectory)
    } else if (properties.output_directory) {
      // output_directory is for compatibility with Sublime
      state.setOutputDirectory(properties.output_directory)
    }

    if (properties.producer) {
      state.setProducer(properties.producer)
    }
  }

  initializeBuildStateFromMagic (state) {
    let magic = this.getMagic(state)

    if (magic.root) {
      state.setFilePath(path.resolve(state.getProjectPath(), magic.root))
      magic = this.getMagic(state)
    }

    this.initializeBuildStateFromProperties(state, magic)
  }

  getMagic (state) {
    return new MagicParser(state.getFilePath()).parse()
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

    const { builder, state } = this.initializeBuild(filePath)
    if (!builder) return false
    state.setShouldRebuild(shouldRebuild)

    if (this.rebuildCompleted && !this.rebuildCompleted.has(state.getFilePath())) {
      state.setShouldRebuild(true)
      this.rebuildCompleted.add(state.getFilePath())
    }

    const label = state.getShouldRebuild() ? 'LaTeX Rebuild' : 'LaTeX Build'

    latex.status.show(label, 'highlight', 'sync', true, 'Click to kill LaTeX build.', () => latex.process.killChildProcesses())
    latex.log.group(label)

    const jobs = state.getJobStates().map(jobState => this.buildJob(builder, jobState))

    await Promise.all(jobs)

    latex.log.groupEnd()
  }

  async buildJob (builder, state) {
    try {
      const statusCode = await builder.run(state)
      builder.parseLogAndFdbFiles(state)

      const messages = state.getLogMessages() || []
      for (const message of messages) {
        latex.log.showMessage(message)
      }

      if (statusCode > 0 || !state.getLogMessages() || !state.getOutputFilePath()) {
        this.showError(state)
      } else {
        if (this.shouldMoveResult(state)) {
          this.moveResult(state)
        }
        this.showResult(state)
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

    const { builder, state } = this.initializeBuild(filePath, true)
    if (!builder) return false

    const jobs = state.getJobStates().map(jobState => this.syncJob(filePath, lineNumber, builder, jobState))

    await Promise.all(jobs)
  }

  async syncJob (filePath, lineNumber, builder, state) {
    const outputFilePath = this.resolveOutputFilePath(builder, state)
    if (!outputFilePath) {
      latex.log.warning('Could not resolve path to output file associated with the current file.')
      return
    }

    await latex.opener.open(outputFilePath, filePath, lineNumber)
  }

  async clean () {
    const { filePath } = getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return false
    }

    latex.log.group('LaTeX Clean')

    const { builder, state } = this.initializeBuild(filePath, true)
    if (!builder) return false

    const jobs = state.getJobStates().map(jobState => this.cleanJob(builder, jobState))

    await Promise.all(jobs)

    latex.log.groupEnd()
  }

  async cleanJob (builder, state) {
    const generatedFiles = this.getGeneratedFileList(builder, state)
    let files = new Set()

    const patterns = this.getCleanPatterns(builder, state)

    for (const pattern of patterns) {
      // If the original pattern is absolute then we use it as a globbing pattern
      // after we join it to the root, otherwise we use it against the list of
      // generated files.
      if (pattern[0] === path.sep) {
        const absolutePattern = path.join(state.getProjectPath(), pattern)
        for (const file of glob.sync(absolutePattern)) {
          files.add(path.normalize(file))
        }
      } else {
        for (const file of generatedFiles.values()) {
          if (minimatch(file, pattern)) {
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

  getCleanPatterns (builder, state) {
    const { name, ext } = path.parse(state.getFilePath())
    const outputDirectory = state.getOutputDirectory()
    const properties = {
      output_dir: outputDirectory ? outputDirectory + path.sep : '',
      jobname: state.getJobname() || name,
      name,
      ext
    }
    const patterns = atom.config.get('latex.cleanPatterns')

    return patterns.map(pattern => path.normalize(replacePropertiesInString(pattern, properties)))
  }

  getGeneratedFileList (builder, state) {
    const { dir, name } = path.parse(state.getFilePath())
    if (!state.getFileDatabase()) {
      builder.parseLogAndFdbFiles(state)
    }

    const pattern = path.resolve(dir, state.getOutputDirectory(), `${state.getJobname() || name}*`)
    const files = new Set(glob.sync(pattern))
    const fdb = state.getFileDatabase()

    if (fdb) {
      const generatedFiles = _.flatten(_.map(fdb, section => section.generated || []))

      for (const file of generatedFiles) {
        files.add(path.resolve(dir, file))
      }
    }

    return files
  }

  moveResult (state) {
    const originalOutputFilePath = state.getOutputFilePath()
    const newOutputFilePath = this.alterParentPath(state.getFilePath(), originalOutputFilePath)
    state.setOutputFilePath(newOutputFilePath)
    if (fs.existsSync(originalOutputFilePath)) {
      fs.removeSync(newOutputFilePath)
      fs.moveSync(originalOutputFilePath, newOutputFilePath)
    }

    const originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, '.synctex.gz')
    if (fs.existsSync(originalSyncFilePath)) {
      const syncFilePath = this.alterParentPath(state.getFilePath(), originalSyncFilePath)
      fs.removeSync(syncFilePath)
      fs.moveSync(originalSyncFilePath, syncFilePath)
    }
  }

  resolveOutputFilePath (builder, state) {
    let outputFilePath = state.getOutputFilePath()
    if (outputFilePath) {
      return outputFilePath
    }

    builder.parseLogAndFdbFiles(state)
    outputFilePath = state.getOutputFilePath()
    if (!outputFilePath) {
      latex.log.warning('Log file parsing failed!')
      return null
    }

    if (this.shouldMoveResult(state)) {
      outputFilePath = this.alterParentPath(state.getFilePath(), outputFilePath)
      state.setOutputFilePath(outputFilePath)
    }

    return outputFilePath
  }

  async showResult (state) {
    if (!this.shouldOpenResult()) { return }

    const { filePath, lineNumber } = getEditorDetails()
    await latex.opener.open(state.getOutputFilePath(), filePath, lineNumber)
  }

  showError (state) {
    if (!state.getLogMessages()) {
      latex.log.error('Parsing of log files failed.')
    } else if (!state.getOutputFilePath()) {
      latex.log.error('No output file detected.')
    }
  }

  isTexFile (filePath) {
    // TODO: Improve will suffice for the time being.
    return !filePath || filePath.search(/\.(tex|lhs|[rs]nw)$/i) > 0
  }

  alterParentPath (targetPath, originalPath) {
    const targetDir = path.dirname(targetPath)
    return path.join(targetDir, path.basename(originalPath))
  }

  shouldMoveResult (state) {
    const moveResult = atom.config.get('latex.moveResultToSourceDirectory')
    return moveResult && state.getOutputDirectory().length > 0
  }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }
}
