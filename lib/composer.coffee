_ = require 'underscore-plus'
fs = require 'fs-plus'
path = require 'path'
ConfigSchema = require './config-schema'
ConsoleLogger = require './loggers/console-logger'
LatexmkBuilder = require './builders/latexmk'
MasterTexFinder = require './master-tex-finder'

ErrorIndicatorView = require './error-indicator-view'
ProgressIndicatorView = require './progress-indicator-view'

module.exports =
class Composer
  constructor: (logger)->
    @log = logger ? new ConsoleLogger()

  build: ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      @log.warning('File needs to be saved to disk before it can be TeXified.')
      return false

    unless @isTexFile(filePath)
      @log.warning("File does not seem to be a TeX file;
        unsupported extension '#{path.extname(filePath)}'.")
      return false

    editor.save() if editor.isModified() # TODO: Make this configurable?

    builder = @getBuilder()
    rootFilePath = @resolveRootFilePath(filePath)
    args = builder.constructArgs(rootFilePath)

    @destroyErrorIndicator()
    @showProgressIndicator()
    proc = builder.run args, (statusCode) =>
      @destroyProgressIndicator()
      result = builder.parseLogFile(rootFilePath)

      unless result?.outputFilePath?
        @showError(statusCode, result, builder)
        return false

      @moveResult(result, rootFilePath) if @shouldMoveResult()
      @showResult(result)

    return true

  sync: ->
    {filePath, lineNumber} = @getEditorDetails()

    unless outputFilePath = @resolveOutputFilePath(filePath)
      @log.warning('Could not resolve path to output file associated with the current file.')
      return

    if opener = @getOpener()
      opener.open(outputFilePath, filePath, lineNumber)

  # TODO: Improve overall code quality within this function.
  # NOTE: Does not support `latex.outputDirectory` setting!
  clean: ->
    editor = atom.workspace.getActivePaneItem()
    unless filePath = editor?.getPath()
      @log.warning('File needs to be saved to disk before clean can find the project files.')
      return

    rootFilePath = @resolveRootFilePath(filePath)
    rootFile = path.basename(rootFilePath)
    rootFilePath = path.dirname(rootFilePath)

    rootFile = rootFile.split('.')
    rootFile.pop()
    rootFile = rootFile.join('.')

    cleanExtensions = atom.config.get('latex.cleanExtensions')
    # NOTE: This needs to be done async, and there's no point in being this noisy.
    for extension in cleanExtensions
      fileToRemove = path.join(rootFilePath, rootFile + extension)
      if fs.existsSync(fileToRemove)
        fs.removeSync(fileToRemove)
        console.info 'LaTeX clean removed: ' + fileToRemove
      else
        console.info 'LaTeX clean did not find: ' + fileToRemove

  setStatusBar: (statusBar) ->
    @statusBar = statusBar

  getBuilder: ->
    new LatexmkBuilder()

  getOpener: ->
    # TODO: Move this to a resolver module? Will get more complex...
    OpenerImpl = switch process.platform
      when 'darwin'
        if fs.existsSync(atom.config.get('latex.skimPath'))
          require './openers/skim-opener'
        else
          require './openers/preview-opener'
      when 'win32'
        if fs.existsSync(atom.config.get('latex.sumatraPath'))
          require './openers/sumatra-opener'
    unless OpenerImpl?
      if atom.packages.resolvePackagePath('pdf-view')?
        OpenerImpl = require './openers/atompdf-opener'
      else
        @log.warning('No PDF opener found. For cross-platform viewing,
          install the pdf-view package.')
        return
    return new OpenerImpl()

  moveResult: (result, filePath) ->
    originalFilePath = result.outputFilePath
    result.outputFilePath = @alterParentPath(filePath, result.outputFilePath)
    if fs.existsSync(originalFilePath)
      fs.moveSync(originalFilePath, result.outputFilePath)

    syncFilePath = originalFilePath.replace(/\.pdf$/, '.synctex.gz')
    if fs.existsSync(syncFilePath)
      fs.moveSync(syncFilePath, @alterParentPath(filePath, syncFilePath))

  resolveRootFilePath: (filePath) ->
    finder = new MasterTexFinder(filePath)
    finder.getMasterTexPath()

  resolveOutputFilePath: (filePath) ->
    rootFilePath = @resolveRootFilePath(filePath)

    unless outputFilePath = @outputLookup?[filePath]
      builder = @getBuilder()
      result = builder.parseLogFile(rootFilePath)
      unless outputFilePath = result?.outputFilePath
        @log.warning('Log file parsing failed!')
        return
      @outputLookup ?= {}
      @outputLookup[filePath] = outputFilePath

    outputFilePath = @alterParentPath(rootFilePath, outputFilePath) if @shouldMoveResult()
    outputFilePath

  showResult: (result) ->
    if @shouldOpenResult() and opener = @getOpener()
      {filePath, lineNumber} = @getEditorDetails()
      opener.open(result.outputFilePath, filePath, lineNumber)

  showError: (statusCode, result, builder) ->
    @showErrorIndicator()
    @log.error(statusCode, result, builder)

  showProgressIndicator: ->
    return @indicator if @indicator?

    @indicator = new ProgressIndicatorView()
    @statusBar?.addRightTile({item: @indicator, priority: 9001})
    @indicator

  showErrorIndicator: ->
    return @errorIndicator if @errorIndicator?

    @errorIndicator = new ErrorIndicatorView()
    @statusBar?.addRightTile({item: @errorIndicator, priority: 9001})
    @errorIndicator

  destroyProgressIndicator: ->
    @indicator?.destroy()
    @indicator = null

  destroyErrorIndicator: ->
    @errorIndicator?.destroy()
    @errorIndicator = null

  isTexFile: (filePath) ->
    # TODO: Improve; will suffice for the time being.
    return filePath?.search(/\.(tex|lhs)$/) > 0

  getEditorDetails: ->
    editor = atom.workspace.getActiveTextEditor()
    return unless editor?

    editorDetails =
      filePath: editor.getPath()
      lineNumber: editor.getCursorScreenPosition().row + 1

  alterParentPath: (targetPath, originalPath) ->
    targetDir = path.dirname(targetPath)
    path.join(targetDir, path.basename(originalPath))

  shouldMoveResult: -> atom.config.get('latex.moveResultToSourceDirectory')
  shouldOpenResult: -> atom.config.get('latex.openResultAfterBuild')
