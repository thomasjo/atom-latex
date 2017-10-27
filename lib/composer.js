/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import { DiCy } from '@dicy/core'
import { getEditorDetails, isSourceFile, isDviFile, isPdfFile, isPsFile, replacePropertiesInString } from './werkzeug'
import minimatch from 'minimatch'
import glob from 'glob'
import yaml from 'js-yaml'
import { CompositeDisposable, Disposable } from 'atom'
import BuildState from './build-state'
import MagicParser from './parsers/magic-parser'

export default class Composer extends Disposable {
  disposables = new CompositeDisposable()
  cachedBuildStates = new Map()
  cachedDiCy = new Map()

  constructor () {
    super(() => this.disposables.dispose())
    this.disposables.add(atom.config.onDidChange('latex', () => this.updateConfiguration()))
  }

  updateConfiguration () {
    // Setting rebuildCompleted to empty set will force rebuild to happen at the
    // next build.
    this.rebuildCompleted = new Set()

    // Get the first cached DiCy builder
    const dicy = this.cachedDiCy.values().next().value
    if (dicy) {
      // Update the options on the first builder. This will set the options in
      // the user's config file. All other builders will then reread the config
      // file on their next build.
      dicy.updateOptions(this.getDiCyOptions(), true)
    }
  }

  initializeBuild (filePath, allowCached = false) {
    let state

    if (allowCached && this.cachedBuildStates.has(filePath)) {
      state = this.cachedBuildStates.get(filePath)
    } else {
      state = new BuildState(filePath)
      this.initializeBuildStateFromConfig(state)
      this.initializeBuildStateFromMagic(state)
      this.initializeBuildStateFromSettingsFile(state)
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

    const builder = latex.builderRegistry.getBuilder(state)
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
    this.initializeBuildStateFromProperties(state, atom.config.get('latex'))
  }

  initializeBuildStateFromProperties (state, properties) {
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

  async getDiCy (filePath, shouldRebuild = false, fastLoad = false) {
    const magic = new MagicParser(filePath).parse()
    if (magic.root) {
      filePath = path.resolve(path.dirname(filePath), magic.root)
    }

    let dicy

    // Logging severity level is set to info so we receive all messages and
    // do our own filtering.
    const options = { severity: 'info' }

    // If fastLoad is set then we avoid cache validation. This makes the sync
    // command more responsive since the sync command only cares about output
    // targets not build inputs.
    if (fastLoad) {
      options.validateCache = false
    }

    if (shouldRebuild) {
      // Respect user settings by only setting loadCache if explicitly
      // instructed to by rebuild command.
      options.loadCache = false
    } else {
      dicy = this.cachedDiCy.get(filePath)
      if (dicy) {
        dicy.setInstanceOptions(options)
        return dicy
      }
    }

    dicy = await DiCy.create(filePath, options)
    if (this.cachedDiCy.size === 0) {
      // This is the first DiCy builder so make sure the user options
      // are synchronized.
      dicy.updateOptions(this.getDiCyOptions(), true)
    }
    this.cachedDiCy.set(filePath, dicy)

    dicy.on('log', event => {
      const nameText = event.name ? `[${event.name}] ` : ''
      const typeText = event.category ? `${event.category}: ` : ''
      const message = {
        type: event.severity,
        text: `${nameText}${typeText}${event.text}`
      }

      if (event.source) {
        message.filePath = path.resolve(dicy.rootPath, event.source.file)
        if (event.source.range) {
          message.range = [[event.source.range.start - 1, 0], [event.source.range.end - 1, Number.MAX_SAFE_INTEGER]]
        }
      }

      if (event.log) {
        message.logPath = path.resolve(dicy.rootPath, event.log.file)
        if (event.log.range) {
          message.logRange = [[event.log.range.start - 1, 0], [event.log.range.end - 1, Number.MAX_SAFE_INTEGER]]
        }
      }

      latex.log.showMessage(message)
    })
    .on('command', event => {
      latex.log.info(`[${event.rule}] Executing \`${event.command}\``)
    })
    .on('fileDeleted', event => {
      if (!event.virtual) {
        latex.log.info(`Deleting \`${event.file}\``)
      }
    })

    return dicy
  }

  getDiCyOptions () {
    // loggingLevel is sent even though it is set to info in getDiCy so that
    // any command line versions of DiCy have the same error reporting level.
    const options = _.pick(atom.config.get('latex'), [
      'customEngine',
      'enableSynctex',
      'engine',
      'loggingLevel',
      'moveResultToSourceDirectory',
      'outputDirectory',
      'outputFormat'
    ])
    const properties = {
      output_dir: `\${OUTDIR}`,
      jobname: `\${JOB}`,
      name: `\${NAME}`,
      ext: `\${OUTEXT}`
    }
    const cleanPatterns = atom.config.get('latex.cleanPatterns')

    // Convert property expansion to DiCy's conventions
    options.cleanPatterns = cleanPatterns.map(pattern => replacePropertiesInString(pattern, properties))

    // Only enable shell escape if explicitly requested. This allows the
    // configuration in texmf-dist to take precedence.
    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    if (enableShellEscape) options.shellEscape = 'enabled'

    // DiCy manages intermediate PostScript production itself, without the
    // wrapper dvipdf since it is not available on Windows.
    const producer = atom.config.get('latex.producer')
    options.intermediatePostScript = producer === 'dvipdf' || producer === 'ps2pdf'

    const PATH = atom.config.get('latex.texPath').trim() || this.defaultTexPath(process.platform)
    if (PATH) options['$PATH'] = PATH

    return options
  }

  defaultTexPath (platform) {
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

  async runDiCy (commands, { shouldRebuild, fastLoad, openResults, clearLog } = { shouldRebuild: false, fastLoad: false, openResults: true, clearLog: false }) {
    const { filePath, lineNumber } = getEditorDetails()
    const dicy = await this.getDiCy(filePath, shouldRebuild, fastLoad)

    if (clearLog) latex.log.clear()
    if (!fastLoad) latex.status.setBusy()

    const success = await dicy.run(...commands)

    if (openResults && success) {
      const targets = await dicy.getTargetPaths(true)
      for (const outputFilePath of targets) {
        // SyncTeX files are considered targets also, so do a positive file type check.
        if (isDviFile(outputFilePath) || isPdfFile(outputFilePath) || isPsFile(outputFilePath)) {
          await latex.opener.open(path.resolve(dicy.rootPath, outputFilePath), filePath, lineNumber)
        }
      }
    }

    if (!fastLoad) latex.status.setIdle()
  }

  async build (shouldRebuild = false, enableLogging = true) {
    await this.kill()

    const { editor, filePath, lineNumber } = getEditorDetails()

    if (!this.isValidSourceFile(filePath, enableLogging)) {
      return false
    }

    if (editor.isModified()) {
      await editor.save() // TODO: Make this configurable?
    }

    if (this.shouldUseDiCy()) {
      return this.runDiCy(['load', 'build', 'log', 'save'], {
        shouldRebuild,
        openResults: this.shouldOpenResult(),
        clearLog: true
      })
    }

    const { builder, state } = this.initializeBuild(filePath)
    if (!builder) return false
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

  async buildJob (filePath, lineNumber, builder, jobState) {
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
        this.showResult(filePath, lineNumber, jobState)
      }
    } catch (error) {
      latex.log.error(error.message)
    }
  }

  kill () {
    latex.process.killChildProcesses()

    const killJobs = Array.from(this.cachedDiCy.values()).map(dicy => dicy.kill())

    return Promise.all(killJobs)
  }

  async sync () {
    const { filePath, lineNumber } = getEditorDetails()
    if (!this.isValidSourceFile(filePath)) {
      return false
    }

    if (this.shouldUseDiCy()) {
      return this.runDiCy(['load'], { fastLoad: true })
    }

    const { builder, state } = this.initializeBuild(filePath, true)
    if (!builder) return false

    const jobs = state.getJobStates().map(jobState => this.syncJob(filePath, lineNumber, builder, jobState))

    await Promise.all(jobs)
  }

  async syncJob (filePath, lineNumber, builder, jobState) {
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
      return false
    }

    if (this.shouldUseDiCy()) {
      return this.runDiCy(['load', 'clean', 'save'], { openResults: false, clearLog: true })
    }

    const { builder, state } = this.initializeBuild(filePath, true)
    if (!builder) return false

    latex.status.setBusy()
    latex.log.clear()

    const jobs = state.getJobStates().map(jobState => this.cleanJob(builder, jobState))

    await Promise.all(jobs)

    latex.status.setIdle()
  }

  async cleanJob (builder, jobState) {
    const generatedFiles = this.getGeneratedFileList(builder, jobState)
    let files = new Set()

    const patterns = this.getCleanPatterns(builder, jobState)

    for (const pattern of patterns) {
      // If the original pattern is absolute then we use it as a globbing pattern
      // after we join it to the root, otherwise we use it against the list of
      // generated files.
      if (pattern[0] === path.sep) {
        const absolutePattern = path.join(jobState.getProjectPath(), pattern)
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
      fs.removeSync(file)
    }
  }

  getCleanPatterns (builder, jobState) {
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

  getGeneratedFileList (builder, jobState) {
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

  moveResult (jobState) {
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

  resolveOutputFilePath (builder, jobState) {
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

  async showResult (filePath, lineNumber, jobState) {
    if (!this.shouldOpenResult()) { return }

    await latex.opener.open(jobState.getOutputFilePath(), filePath, lineNumber)
  }

  showError (jobState) {
    if (!jobState.getLogMessages()) {
      latex.log.error('Parsing of log files failed.')
    } else if (!jobState.getOutputFilePath()) {
      latex.log.error('No output file detected.')
    }
  }

  isValidSourceFile (filePath, enableLogging = true) {
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

  alterParentPath (targetPath, originalPath) {
    const targetDir = path.dirname(targetPath)
    return path.join(targetDir, path.basename(originalPath))
  }

  shouldMoveResult (jobState) {
    return jobState.getMoveResultToSourceDirectory() && jobState.getOutputDirectory().length > 0
  }

  shouldUseDiCy () { return atom.config.get('latex.useDicy') }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }
}
