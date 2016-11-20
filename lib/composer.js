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
      if (!this.initializeBuildStateFromLatexJson(state)) {
        this.initializeBuildStateFromMagic(state)
      }
      // Check again in case there was a root comment
      if (filePath !== state.filePath) {
        if (allowCached && this.cachedBuildStates.has(state.filePath)) {
          state = this.cachedBuildStates.get(state.filePath)
        }
        state.subfiles.add(filePath)
      }
      this.cacheBuildState(state)
    }

    const builder = latex.builderRegistry.getBuilder(state.filePath)
    if (!builder) {
      latex.log.warning(`No registered LaTeX builder can process ${filePath}.`)
      return state
    }

    return { state, builder }
  }

  cacheBuildState (state) {
    if (this.cachedBuildStates.has(state.filePath)) {
      const oldState = this.cachedBuildStates.get(state.filePath)
      for (const subfile of oldState.subfiles.values()) {
        this.cachedBuildStates.delete(subfile)
      }
      this.cachedBuildStates.delete(state.filePath)
    }

    this.cachedBuildStates.set(state.filePath, state)
    for (const subfile of state.subfiles.values()) {
      this.cachedBuildStates.set(subfile, state)
    }
  }

  initializeBuildStateFromConfig (state) {
    state.enableSynctex = atom.config.get('latex.enableSynctex')
    state.enableShellEscape = atom.config.get('latex.enableShellEscape')
    state.enableExtendedBuildMode = atom.config.get('latex.enableExtendedBuildMode')
    state.engine = atom.config.get('latex.customEngine') || atom.config.get('latex.engine')
    state.outputDirectory = atom.config.get('latex.outputDirectory')
    state.outputFormat = atom.config.get('latex.outputFormat')
    state.producer = atom.config.get('latex.producer')
  }

  initializeBuildStateFromProperties (state, properties) {
    if (!properties) return

    if (properties.enableSynctex) {
      state.enableSynctex = !!properties.enableSynctex
    }

    if (properties.enableShellEscape) {
      state.enableShellEscape = !!properties.enableShellEscape
    }

    if (properties.enableExtendedBuildMode) {
      state.enableExtendedBuildMode = !!properties.enableExtendedBuildMode
    }

    if (properties.jobnames) {
      // Look for a string in case it is from magic properties
      state.jobnames = typeof properties.jobnames === 'string' ? properties.jobnames.split(/[,\s]+/) : properties
    } else if (properties.jobname) {
      // jobname is for compatibility with Sublime
      state.jobnames = [properties.jobname]
    }

    if (properties.engine) {
      // engine is to maintain consistency with our setting schema
      state.engine = properties.engine
    } else if (properties.program) {
      // program is for compatibility with magic comments
      state.engine = properties.program
    }

    if (properties.outputFormat) {
      // outputFormat is to maintain consistency with our setting schema
      state.outputFormat = properties.outputFormat
    } else if (properties.format) {
      // format is form compatibility with magic comments
      state.outputFormat = properties.format
    }

    if (properties.outputDirectory) {
      // outputDirectory is to maintain consistency with our setting schema
      state.outputDirectory = properties.outputDirectory
    } else if (properties.output_directory) {
      // output_directory is for compatibility with Sublime
      state.outputDirectory = properties.output_directory
    }

    if (properties.producer) {
      state.producer = properties.producer
    }
  }

  initializeBuildStateFromMagic (state) {
    let magic = this.getMagic(state)

    if (magic.root) {
      state.filePath = path.resolve(state.projectPath, magic.root)
      magic = this.getMagic(state)
    }

    this.initializeBuildStateFromProperties(state, magic)
  }

  initializeBuildStateFromLatexJson (state) {
    let [ projectPath, relativePath ] = atom.project.relativizePath(state.projectPath)
    // Just in case there no project in Atom
    projectPath = projectPath || '.'
    // Atom returns an empty string instead of '.'
    relativePath = path.normalize(relativePath)

    // Start in the current directory then move to the parent looking for a
    // latex.json file.
    while (relativePath !== '..') {
      const latexJsonPath = path.resolve(projectPath, relativePath, 'latex.json')
      if (fs.existsSync(latexJsonPath)) {
        return this.doInitializeBuildStateFromLatexJson(state, latexJsonPath)
      }
      relativePath = path.join(relativePath, '..')
    }

    return false
  }

  doInitializeBuildStateFromLatexJson (state, latexJsonPath) {
    try {
      const latexJson = JSON.parse(fs.readFileSync(latexJsonPath))
      const rootPath = path.dirname(latexJsonPath)
      const name = path.relative(rootPath, state.filePath)
      const globalSection = latexJson['*']
      let fileSection = latexJson[name]

      // First look for a global section
      if (globalSection) {
        if (globalSection.root) {
          state.filePath = path.resolve(rootPath, globalSection.root)
        }
        this.initializeBuildStateFromProperties(state, globalSection)
        return true
      }

      if (fileSection) {
        if (fileSection.root) {
          state.filePath = path.resolve(rootPath, fileSection.root)
          // use properties from root section
          fileSection = latexJson[fileSection.root]
        }
        this.initializeBuildStateFromProperties(state, fileSection)
        return true
      }
    } catch (error) {
      latex.log.error(`Parsing of latex.json failed: ${error.message}`)
    }

    return false
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
      const statusCode = await builder.run(state)
      builder.parseLogAndFdbFiles(state)

      if (state.results.log && state.results.log.messages) {
        for (const message of state.results.log.messages) {
          latex.log.showMessage(message)
        }
      }

      if (statusCode > 0 || !state.results.log || !state.outputFilePath) {
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

    const { builder, state } = this.initializeBuild(filePath, true)
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
    if (!state.fdb) {
      builder.parseLogAndFdbFiles(state)
    }

    const pattern = path.resolve(dir, state.outputDirectory, `${state.jobname || name}*`)
    const files = new Set(glob.sync(pattern))

    if (state.fdb) {
      const generatedFiles = _.flatten(_.map(state.fdb, section => section.generated || []))

      for (const file of generatedFiles) {
        files.add(path.resolve(dir, file))
      }
    }

    return files
  }

  moveResult (state) {
    const originalOutputFilePath = state.outputFilePath
    state.outputFilePath = this.alterParentPath(state.filePath, originalOutputFilePath)
    if (fs.existsSync(originalOutputFilePath)) {
      fs.removeSync(state.outputFilePath)
      fs.moveSync(originalOutputFilePath, state.outputFilePath)
    }

    const originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, '.synctex.gz')
    if (fs.existsSync(originalSyncFilePath)) {
      const syncFilePath = this.alterParentPath(state.filePath, originalSyncFilePath)
      fs.removeSync(syncFilePath)
      fs.moveSync(originalSyncFilePath, syncFilePath)
    }
  }

  resolveOutputFilePath (builder, state) {
    if (state.outputFilePath) {
      return state.outputFilePath
    }

    builder.parseLogAndFdbFiles(state)
    if (!state.outputFilePath) {
      latex.log.warning('Log file parsing failed!')
      return null
    }

    if (this.shouldMoveResult(state)) {
      state.outputFilePath = this.alterParentPath(state.filePath, state.outputFilePath)
    }

    return state.outputFilePath
  }

  async showResult (state) {
    if (!this.shouldOpenResult()) { return }

    const { filePath, lineNumber } = getEditorDetails()
    await latex.opener.open(state.outputFilePath, filePath, lineNumber)
  }

  showError (state) {
    if (!state.results.log) {
      latex.log.error('Parsing of log files failed.')
    } else if (!state.outputFilePath) {
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
    return moveResult && state.outputDirectory.length > 0
  }

  shouldOpenResult () { return atom.config.get('latex.openResultAfterBuild') }
}
