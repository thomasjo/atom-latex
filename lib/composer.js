/* @flow */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
// $FlowIgnore
import { getEditorDetails, replacePropertiesInString } from './werkzeug'
import minimatch from 'minimatch'
import glob from 'glob'
import yaml from 'js-yaml'
import { CompositeDisposable } from 'atom'
import { BuildState, JobState } from './build-state'
import MagicParser from './parsers/magic-parser'
import Builder from './builder'

type Build = {
  state: BuildState,
  builder?: Builder
}

export default class Composer {
  disposables = new CompositeDisposable()
  cachedBuildStates: Map<string, BuildState> = new Map()
  rebuildCompleted: Set<string>

  constructor () {
    this.disposables.add(atom.config.onDidChange('latex', () => {
      this.rebuildCompleted = new Set()
    }))
  }

  dispose () {
    this.disposables.dispose()
  }

  initializeBuild (filePath: string, allowCached: boolean = false): Build {
    let state = this.cachedBuildStates.get(filePath)

    if (!allowCached || !state) {
      state = new BuildState(filePath)
      this.initializeBuildStateFromConfig(state)
      this.initializeBuildStateFromMagic(state)
      this.initializeBuildStateFromSettingsFile(state)
      // Check again in case there was a root comment
      const masterFilePath = state.getFilePath()
      if (filePath !== masterFilePath) {
        const cachedState = this.cachedBuildStates.get(filePath)
        if (allowCached && cachedState) {
          state = cachedState
        }
        state.addSubfile(filePath)
      }
      this.cacheBuildState(state)
    }

    const builder = latex.builderRegistry.getBuilder(state)
    if (!builder) {
      latex.log.warning(`No registered LaTeX builder can process ${state.getFilePath()}.`)
      return { state }
    }

    return { state, builder }
  }

  cacheBuildState (state: BuildState): void {
    const filePath = state.getFilePath()
    const oldState = this.cachedBuildStates.get(filePath)
    if (oldState) {
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

  initializeBuildStateFromConfig (state: BuildState): void {
    this.initializeBuildStateFromProperties(state, atom.config.get('latex'))
  }

  initializeBuildStateFromProperties (state: BuildState, properties: ?Object): void {
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

  initializeBuildStateFromMagic (state: BuildState): void {
    let magic = this.getMagic(state)
    if (!magic) return

    if (magic.root) {
      state.setFilePath(path.resolve(state.getProjectPath(), magic.root))
      magic = this.getMagic(state)
    }

    this.initializeBuildStateFromProperties(state, magic)
  }

  getMagic (state: BuildState): ?Object {
    return new MagicParser(state.getFilePath()).parse()
  }

  initializeBuildStateFromSettingsFile (state) {
    try {
      const { dir, name } = path.parse(state.getFilePath())
      const filePath = path.format({ dir, name, ext: '.yaml' })

      if (fs.existsSync(filePath)) {
        const config = yaml.safeLoad(fs.readFileSync(filePath))
        this.initializeBuildStateFromProperties(state, config)
      }
    } catch (error) {
      latex.log.error(`Parsing of project file failed: ${error.message}`)
    }
  }

  async build (shouldRebuild: boolean = false): Promise<boolean> {
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

    return true
  }

  async buildJob (builder: Builder, jobState: JobState) {
    try {
      const statusCode = await builder.run(jobState)
      builder.parseLogAndFdbFiles(jobState)

      const messages = jobState.getLogMessages() || []
      for (const message of messages) {
        latex.log.showMessage(message)
      }

      if (statusCode > 0 || !jobState.getLogMessages() || !jobState.getOutputFilePath()) {
        this.showError(jobState)
      } else {
        if (this.shouldMoveResult(jobState)) {
          this.moveResult(jobState)
        }
        this.showResult(jobState)
      }
    } catch (error) {
      latex.log.error(error.message)
    }
  }

  async sync (): Promise<boolean> {
    const { filePath, lineNumber } = getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return false
    }

    const { builder, state } = this.initializeBuild(filePath, true)
    if (!builder) return false

    const jobs = state.getJobStates().map(jobState => this.syncJob(filePath, lineNumber, builder, jobState))

    await Promise.all(jobs)

    return true
  }

  async syncJob (filePath: string, lineNumber: number, builder: Builder, jobState: JobState) {
    const outputFilePath = this.resolveOutputFilePath(builder, jobState)
    if (!outputFilePath) {
      latex.log.warning('Could not resolve path to output file associated with the current file.')
      return
    }

    await latex.opener.open(outputFilePath, filePath, lineNumber)
  }

  async clean (): Promise<boolean> {
    const { filePath } = getEditorDetails()
    if (!filePath || !this.isTexFile(filePath)) {
      return false
    }

    const { builder, state } = this.initializeBuild(filePath, true)
    if (!builder) return false

    latex.log.group('LaTeX Clean')

    const jobs = state.getJobStates().map(jobState => this.cleanJob(builder, jobState))

    await Promise.all(jobs)

    latex.log.groupEnd()

    return true
  }

  async cleanJob (builder: Builder, jobState: JobState) {
    const generatedFiles = this.getGeneratedFileList(builder, jobState)
    let files = new Set()

    const patterns = this.getCleanPatterns(builder, jobState)

    for (const pattern of patterns) {
      // If the original pattern is absolute then we use it as a globbing pattern
      // after we join it to the root, otherwise we use it against the list of
      // generated files.
      if (pattern[0] === path.sep) {
        const absolutePattern = path.join(jobState.getProjectPath(), pattern)
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

  getCleanPatterns (builder: Builder, jobState: JobState) {
    const { name, ext } = path.parse(jobState.getFilePath())
    const outputDirectory = jobState.getOutputDirectory()
    const properties = {
      output_dir: outputDirectory ? outputDirectory + path.sep : '',
      jobname: jobState.getJobName() || name,
      name,
      ext
    }
    const patterns = jobState.getCleanPatterns()

    return patterns.map(pattern => path.normalize(replacePropertiesInString(pattern, properties)))
  }

  getGeneratedFileList (builder: Builder, jobState: JobState) {
    const { dir, name } = path.parse(jobState.getFilePath())
    if (!jobState.getFileDatabase()) {
      builder.parseLogAndFdbFiles(jobState)
    }

    const pattern = path.resolve(dir, jobState.getOutputDirectory(), `${jobState.getJobName() || name}*`)
    const files = new Set(glob.sync(pattern))
    const fdb = jobState.getFileDatabase()

    if (fdb) {
      const generatedFiles = _.flatten(_.map(fdb, section => section.generated || []))

      for (const file of generatedFiles) {
        files.add(path.resolve(dir, file))
      }
    }

    return files
  }

  moveResult (jobState: JobState) {
    const originalOutputFilePath = jobState.getOutputFilePath()
    const newOutputFilePath = this.alterParentPath(jobState.getFilePath(), originalOutputFilePath)
    jobState.setOutputFilePath(newOutputFilePath)
    if (fs.existsSync(originalOutputFilePath)) {
      fs.removeSync(newOutputFilePath)
      fs.moveSync(originalOutputFilePath, newOutputFilePath)
    }

    const originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, '.synctex.gz')
    if (fs.existsSync(originalSyncFilePath)) {
      const syncFilePath = this.alterParentPath(jobState.getFilePath(), originalSyncFilePath)
      fs.removeSync(syncFilePath)
      fs.moveSync(originalSyncFilePath, syncFilePath)
    }
  }

  resolveOutputFilePath (builder: Builder, jobState: JobState) {
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

  async showResult (jobState: JobState) {
    if (!this.shouldOpenResult()) { return }

    const { filePath, lineNumber } = getEditorDetails()
    await latex.opener.open(jobState.getOutputFilePath(), filePath, lineNumber)
  }

  showError (jobState: JobState) {
    if (!jobState.getLogMessages()) {
      latex.log.error('Parsing of log files failed.')
    } else if (!jobState.getOutputFilePath()) {
      latex.log.error('No output file detected.')
    }
  }

  isTexFile (filePath: string): boolean {
    // TODO: Improve will suffice for the time being.
    return !filePath || filePath.search(/\.(tex|lhs|[rs]nw)$/i) > 0
  }

  alterParentPath (targetPath: string, originalPath: string): string {
    const targetDir = path.dirname(targetPath)
    return path.join(targetDir, path.basename(originalPath))
  }

  shouldMoveResult (jobState: JobState) {
    return jobState.getMoveResultToSourceDirectory() && jobState.getOutputDirectory().length > 0
  }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }
}
