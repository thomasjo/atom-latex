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
  outputLookup = new Map()

  constructor () {
    super(() => this.disposables.dispose())
    this.disposables.add(atom.config.onDidChange('latex', () => {
      this.rebuildCompleted = new Set()
    }))
  }

  initializeBuild (filePath) {
    let state = new BuildState(filePath)

    this.initializeBuildStateFromConfig(state)
    this.initializeBuildStateFromMagic(state)

    const builder = latex.builderRegistry.getBuilder(state.filePath)
    if (!builder) {
      latex.log.warning(`No registered LaTeX builder can process ${filePath}.`)
      return state
    }

    return { state, builder }
  }

  initializeBuildStateFromConfig (state) {
    state.engine = atom.config.get('latex.customEngine') || atom.config.get('latex.engine')
    state.outputDirectory = atom.config.get('latex.outputDirectory')
    state.outputFormat = atom.config.get('latex.outputFormat')
    state.producer = atom.config.get('latex.producer')
  }

  initializeBuildStateFromMagic (state) {
    let magic = this.getMagic(state)

    if (magic.root) {
      state.filePath = path.resolve(state.projectPath, magic.root)
      magic = this.getMagic(state)
    }

    if (magic.engine) {
      state.engine = magic.engine
    }

    if (magic.format) {
      state.outputFormat = magic.format
    }

    if (magic.output_directory) {
      state.outputDirectory = magic.output_directory
    }

    if (magic.producer) {
      state.producer = magic.producer
    }
  }

  getMagic (state) {
    return new MagicParser(state.filePath).parse()
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
    state.shouldRebuild = shouldRebuild

    if (this.rebuildCompleted && !this.rebuildCompleted.has(state.filePath)) {
      state.shouldRebuild = true
      this.rebuildCompleted.add(state.filePath)
    }

    const label = state.shouldRebuild ? 'LaTeX Rebuild' : 'LaTeX Build'

    latex.status.show(label, 'highlight', 'sync', true, 'Click to kill LaTeX build.', () => latex.process.killChildProcesses())
    latex.log.group(label)

    const jobs = state.jobStates.map(jobState => this.buildJob(builder, jobState))

    await Promise.all(jobs)

    latex.log.groupEnd()
  }

  async buildJob (builder, state) {
    try {
      const statusCode = await builder.run(state, state.filePath)
      const result = builder.parseLogAndFdbFiles(state)

      if (result) {
        for (const message of result.messages) {
          latex.log.showMessage(message)
        }
      }

      if (statusCode > 0 || !result || !result.outputFilePath) {
        this.showError(result)
      } else {
        if (this.shouldMoveResult(builder, state.filePath)) {
          this.moveResult(result, state.filePath)
        }
        // Cache the output file path for sync
        this.outputLookup.set({ filePath: state.filePath, jobname: state.jobname }, result.outputFilePath)
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

    const { builder, state } = this.initializeBuild(filePath)
    if (!builder) return false

    const jobs = state.jobStates.map(jobState => this.syncJob(filePath, lineNumber, builder, jobState))

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

    const { builder, state } = this.initializeBuild(filePath)
    if (!builder) return false

    const jobs = state.jobStates.map(jobState => this.cleanJob(builder, jobState))

    await Promise.all(jobs)

    latex.log.groupEnd()
  }

  async cleanJob (builder, state) {
    const generatedFiles = this.getGeneratedFileList(builder, state)
    let files = new Set()

    const patterns = this.getCleanPatterns(builder, state)

    for (const pattern of patterns) {
      console.log(pattern)
      // If the original pattern is absolute then we use it as a globbing pattern
      // after we join it to the root, otherwise we use it against the list of
      // generated files.
      if (pattern[0] === path.sep) {
        const absolutePattern = path.join(state.projectPath, pattern)
        for (const file of glob.sync(absolutePattern)) {
          files.add(path.normalize(file))
        }
      } else {
        for (const file of generatedFiles.values()) {
          console.log(file)
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
    const { name, ext } = path.parse(state.filePath)
    const outputDirectory = state.outputDirectory
    const properties = {
      output_dir: outputDirectory ? outputDirectory + path.sep : '',
      jobname: state.jobname || name,
      name,
      ext
    }
    const patterns = atom.config.get('latex.cleanPatterns')

    return patterns.map(pattern => path.normalize(replacePropertiesInString(pattern, properties)))
  }

  getGeneratedFileList (builder, state) {
    const { dir, name } = path.parse(state.filePath)
    const fdb = builder.parseFdbFile(state)

    const pattern = path.resolve(dir, state.outputDirectory, `${state.jobname || name}*`)
    const files = new Set(glob.sync(pattern))

    if (fdb) {
      const generatedFiles = _.flatten(_.map(fdb, section => section.generated || []))

      for (const file of generatedFiles) {
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

  resolveOutputFilePath (builder, state) {
    const label = { filePath: state.filePath, jobname: state.jobname }

    if (this.outputLookup.has(label)) {
      return this.outputLookup.get(label)
    }

    const result = builder.parseLogAndFdbFiles(state)
    if (!result || !result.outputFilePath) {
      latex.log.warning('Log file parsing failed!')
      return null
    }

    let outputFilePath = result.outputFilePath
    if (this.shouldMoveResult(builder, state.filePath)) {
      outputFilePath = this.alterParentPath(state.filePath, outputFilePath)
    }
    this.outputLookup.set(label, outputFilePath)

    return outputFilePath
  }

  async showResult (result) {
    if (!this.shouldOpenResult()) { return }

    const { filePath, lineNumber } = getEditorDetails()
    await latex.opener.open(result.outputFilePath, filePath, lineNumber)
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
}
