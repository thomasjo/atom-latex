import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { getEditorDetails, isSourceFile, replacePropertiesInString } from './werkzeug'
import minimatch from 'minimatch'
import glob from 'glob'
import yaml from 'js-yaml'
import { CompositeDisposable, Disposable } from 'atom'
import BuildState from './build-state'
import JobState from './job-state'
import MagicParser from './parsers/magic-parser'

export default class Composer extends Disposable {
  disposables = new CompositeDisposable()
  cachedBuildStates = new Map<string, BuildState>()
  rebuildCompleted = new Set()

  constructor () {
    super(() => {
      this.disposables.dispose()
    })

    this.disposables.add(atom.config.onDidChange('latex', () => this.updateConfiguration()))
  }

  updateConfiguration () {
    // Setting rebuildCompleted to empty set will force rebuild to happen at the next build.
    this.rebuildCompleted = new Set()
  }

  initializeBuild (filePath: string, allowCached = false) {
    let state: BuildState

    if (allowCached && this.cachedBuildStates.has(filePath)) {
      state = this.cachedBuildStates.get(filePath)!
    } else {
      state = new BuildState(filePath)
      this.initializeBuildStateFromConfig(state)
      this.initializeBuildStateFromMagic(state)
      this.initializeBuildStateFromSettingsFile(state)
      // Check again in case there was a root comment
      const masterFilePath = state.getFilePath()
      if (masterFilePath && filePath !== masterFilePath) {
        if (allowCached && this.cachedBuildStates.has(masterFilePath)) {
          state = this.cachedBuildStates.get(masterFilePath)!
        }
        state.addSubfile(filePath)
      }
      this.cacheBuildState(state)
    }

    const builder = latex.builderRegistry.getBuilder(state)
    if (!builder) {
      latex.log.warning(`No registered LaTeX builder can process ${state.getFilePath()}.`)
      return { state, builder: null }
    }

    return { state, builder }
  }

  cacheBuildState (state: BuildState) {
    const filePath = state.getFilePath()
    if (!filePath) return

    if (this.cachedBuildStates.has(filePath)) {
      const oldState = this.cachedBuildStates.get(filePath)!
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

  initializeBuildStateFromConfig (state: BuildState) {
    this.initializeBuildStateFromProperties(state, atom.config.get('latex'))
  }

  initializeBuildStateFromProperties (state: BuildState, properties: any) {
    if (!properties) return

    if (properties.cleanPatterns) {
      state.setCleanPatterns(properties.cleanPatterns)
    }

    if ('enableSynctex' in properties) {
      state.setEnableSynctex(properties.enableSynctex)
    }

    if ('enableShellEscape' in properties) {
      state.setEnableShellEscape(properties.enableShellEscape)
    }

    if ('enableExtendedBuildMode' in properties) {
      state.setEnableExtendedBuildMode(properties.enableExtendedBuildMode)
    }

    if (properties.jobNames) {
      state.setJobNames(properties.jobNames)
    } else if (properties.jobnames) {
      // jobnames is for compatibility with magic comments
      state.setJobNames(properties.jobnames)
    } else if (properties.jobname) {
      // jobname is for compatibility with Sublime
      state.setJobNames([properties.jobname])
    }

    if (properties.customEngine) {
      state.setEngine(properties.customEngine)
    } else if (properties.engine) {
      state.setEngine(properties.engine)
    } else if (properties.program) {
      // program is for compatibility with magic comments
      state.setEngine(properties.program)
    }

    if ('moveResultToSourceDirectory' in properties) {
      state.setMoveResultToSourceDirectory(properties.moveResultToSourceDirectory)
    }

    if (properties.outputFormat) {
      state.setOutputFormat(properties.outputFormat)
    } else if (properties.format) {
      // format is for compatibility with magic comments
      state.setOutputFormat(properties.format)
    }

    if ('outputDirectory' in properties) {
      state.setOutputDirectory(properties.outputDirectory)
    } else if ('output_directory' in properties) {
      // output_directory is for compatibility with Sublime
      state.setOutputDirectory(properties.output_directory)
    }

    if (properties.producer) {
      state.setProducer(properties.producer)
    }
  }

  initializeBuildStateFromMagic (state: BuildState) {
    let magic = this.getMagic(state)

    if (magic.root) {
      state.setFilePath(path.resolve(state.getProjectPath()!, magic.root))
      magic = this.getMagic(state)
    }

    this.initializeBuildStateFromProperties(state, magic)
  }

  getMagic (state: BuildState) {
    return new MagicParser(state.getFilePath()).parse()
  }

  initializeBuildStateFromSettingsFile (state: BuildState) {
    try {
      const { dir, name } = path.parse(state.getFilePath())
      const filePath = path.format({ dir, name, ext: '.yaml' })

      if (fs.existsSync(filePath)) {
        const config = yaml.safeLoad(fs.readFileSync(filePath, { encoding: 'utf-8' }))
        this.initializeBuildStateFromProperties(state, config)
      }
    } catch (error) {
      latex.log.error(`Parsing of project file failed: ${error.message}`)
    }
  }

  defaultTexPath (platform: string) {
    switch (platform) {
      case 'win32':
        return [
          '%SystemDrive%\\texlive\\2017\\bin\\win32',
          '%SystemDrive%\\texlive\\2016\\bin\\win32',
          '%SystemDrive%\\texlive\\2015\\bin\\win32',
          '%ProgramFiles%\\MiKTeX 2.9\\miktex\\bin\\x64',
          '%ProgramFiles(x86)%\\MiKTeX 2.9\\miktex\\bin',
          '$PATH'
        ].join(path.delimiter)
      case 'darwin':
        return [
          '/usr/texbin',
          '/Library/TeX/texbin',
          '$PATH'
        ].join(path.delimiter)
    }
  }

  async build (shouldRebuild = false, enableLogging = true) {
    this.kill()

    const { editor, filePath, lineNumber } = getEditorDetails()

    if (!editor || !filePath || !lineNumber) {
      return
    }

    if (!this.isValidSourceFile(filePath, enableLogging)) {
      return
    }

    if (editor.isModified()) {
      await editor.save() // TODO: Make this configurable?
    }

    const { builder, state } = this.initializeBuild(filePath)
    if (!builder) return
    state.setShouldRebuild(shouldRebuild)

    if (this.rebuildCompleted && !this.rebuildCompleted.has(state.getFilePath())) {
      state.setShouldRebuild(true)
      this.rebuildCompleted.add(state.getFilePath())
    }

    latex.log.clear()
    latex.status.setBusy()

    const jobs = state.getJobStates().map(jobState => this.buildJob(filePath, lineNumber, builder, jobState))
    await Promise.all(jobs)

    latex.status.setIdle()
  }

  async buildJob (filePath: string, lineNumber: number, builder: any, jobState: JobState) {
    try {
      const statusCode = await builder.run(jobState)
      builder.parseLogAndFdbFiles(jobState)

      const messages = jobState.getLogMessages() || []
      latex.log.showMessages(messages)

      if (statusCode > 0 || !jobState.getLogMessages() || !jobState.getOutputFilePath()) {
        this.showError(jobState)
      } else {
        if (this.shouldMoveResult(jobState)) {
          this.moveResult(jobState)
        }
        await this.showResult(filePath, lineNumber, jobState)
      }
    } catch (error) {
      latex.log.error(error.message)
    }
  }

  async kill () {
    latex.process.killChildProcesses()
  }

  async sync () {
    const { filePath, lineNumber } = getEditorDetails()

    if (!this.isValidSourceFile(filePath)) {
      return
    }

    const { builder, state } = this.initializeBuild(filePath!, true)
    if (!builder) {
      return
    }

    const jobs = state.getJobStates().map(jobState => this.syncJob(filePath!, lineNumber!, builder, jobState))
    await Promise.all(jobs)
  }

  async syncJob (filePath: string, lineNumber: number, builder: any, jobState: JobState) {
    const outputFilePath = this.resolveOutputFilePath(builder, jobState)
    if (!outputFilePath) {
      latex.log.warning('Could not resolve path to output file associated with the current file.')
      return
    }

    await latex.opener.open(outputFilePath, filePath, lineNumber)
  }

  async clean () {
    const { filePath } = getEditorDetails()
    if (!this.isValidSourceFile(filePath)) {
      return
    }

    const { builder, state } = this.initializeBuild(filePath!, true)
    if (!builder) {
      return
    }

    latex.status.setBusy()
    latex.log.clear()

    const jobs = state.getJobStates().map(jobState => this.cleanJob(builder, jobState))
    await Promise.all(jobs)

    latex.status.setIdle()
  }

  cleanJob (builder: any, jobState: JobState) {
    const generatedFiles = this.getGeneratedFileList(builder, jobState)
    let files = new Set()

    const patterns = this.getCleanPatterns(jobState)
    const projectPath = jobState.getProjectPath()

    for (const pattern of patterns) {
      // If the original pattern is absolute then we use it as a globbing pattern
      // after we join it to the root, otherwise we use it against the list of
      // generated files.
      if (projectPath && pattern[0] === path.sep) {
        const absolutePattern = path.join(projectPath, pattern)
        for (const file of glob.sync(absolutePattern, { dot: true })) {
          files.add(path.normalize(file))
        }
      } else {
        for (const file of generatedFiles.values()) {
          if (minimatch(file, pattern, { dot: true })) {
            files.add(file)
          }
        }
      }
    }

    const fileNames = Array.from(files.values()).map(file => path.basename(file)).join(', ')
    latex.log.info('Cleaned: ' + fileNames)

    for (const file of files.values()) {
      rimraf.sync(file)
    }
  }

  getCleanPatterns (jobState: JobState) {
    const { name, ext } = path.parse(jobState.getFilePath())
    const outputDirectory = jobState.getOutputDirectory()
    const properties = {
      output_dir: outputDirectory ? outputDirectory + path.sep : '',
      jobname: jobState.getJobName() || name,
      name,
      ext
    }

    const patterns = jobState.getCleanPatterns()
    if (patterns) {
      return patterns.map(pattern => path.normalize(replacePropertiesInString(pattern, properties)))
    }

    return []
  }

  getGeneratedFileList (builder: any, jobState: JobState) {
    const { dir, name } = path.parse(jobState.getFilePath())

    if (!jobState.getFileDatabase()) {
      builder.parseLogAndFdbFiles(jobState)
    }

    let files: Set<string>
    const outputDirectory = jobState.getOutputDirectory()
    if (outputDirectory) {
      const pattern = path.resolve(dir, outputDirectory, `${jobState.getJobName() || name}*`)
      files = new Set(glob.sync(pattern))
    } else {
      files = new Set()
    }

    const fileDatabase = jobState.getFileDatabase()
    if (fileDatabase) {
      const generatedFiles = _.flatten(_.map(fileDatabase, (section: any) => section.generated || []))
      for (const file of generatedFiles) {
        files.add(path.resolve(dir, file))
      }
    }

    return files
  }

  moveResult (jobState: JobState) {
    const originalOutputFilePath = jobState.getOutputFilePath()
    if (!originalOutputFilePath) return

    const newOutputFilePath = this.alterParentPath(jobState.getFilePath(), originalOutputFilePath)
    jobState.setOutputFilePath(newOutputFilePath)
    if (fs.existsSync(originalOutputFilePath)) {
      fs.unlinkSync(newOutputFilePath)
      fs.renameSync(originalOutputFilePath, newOutputFilePath)
    }

    const originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, '.synctex.gz')
    if (fs.existsSync(originalSyncFilePath)) {
      const syncFilePath = this.alterParentPath(jobState.getFilePath(), originalSyncFilePath)
      fs.unlinkSync(syncFilePath)
      fs.renameSync(originalSyncFilePath, syncFilePath)
    }
  }

  resolveOutputFilePath (builder: any, jobState: JobState) {
    let outputFilePath = jobState.getOutputFilePath()
    if (outputFilePath) {
      return outputFilePath
    }

    builder.parseLogAndFdbFiles(jobState)
    outputFilePath = jobState.getOutputFilePath()
    if (!outputFilePath) {
      latex.log.warning('Log file parsing failed!')
      return null
    }

    if (this.shouldMoveResult(jobState)) {
      outputFilePath = this.alterParentPath(jobState.getFilePath(), outputFilePath)
      jobState.setOutputFilePath(outputFilePath)
    }

    return outputFilePath
  }

  async showResult (filePath: string, lineNumber: any, jobState: JobState) {
    if (!this.shouldOpenResult()) { return }

    await latex.opener.open(jobState.getOutputFilePath()!, filePath, lineNumber)
  }

  showError (jobState: JobState) {
    if (!jobState.getLogMessages()) {
      latex.log.error('Parsing of log files failed.')
    } else if (!jobState.getOutputFilePath()) {
      latex.log.error('No output file detected.')
    }
  }

  isValidSourceFile (filePath?: string, enableLogging = true) {
    if (!filePath) {
      if (enableLogging) {
        latex.log.warning('File needs to be saved to disk before it can be processed.')
      }
      return false
    }

    if (!isSourceFile(filePath)) {
      if (enableLogging) {
        latex.log.warning('File does not appear to be a valid source file.')
      }
      return false
    }

    return true
  }

  alterParentPath (targetPath: string, originalPath: string) {
    const targetDir = path.dirname(targetPath)
    return path.join(targetDir, path.basename(originalPath))
  }

  shouldMoveResult (jobState: JobState) {
    const outputDirectory = jobState.getOutputDirectory()
    return jobState.getMoveResultToSourceDirectory() && !!outputDirectory && outputDirectory.length > 0
  }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }
}
