fs = require 'fs-plus'
path = require 'path'

module.exports =
class Composer
  destroy: ->
    @destroyProgressIndicator()
    @destroyErrorIndicator()

  build: ->
    {editor, filePath} = @getEditorDetails()

    unless filePath?
      latex.log.warning('File needs to be saved to disk before it can be TeXified.')
      return Promise.reject(false)

    unless @isTexFile(filePath)
      latex.log.warning("File does not seem to be a TeX file;
        unsupported extension '#{path.extname(filePath)}'.")
      return Promise.reject(false)

    editor.save() if editor.isModified() # TODO: Make this configurable?

    builder = latex.getBuilder()
    rootFilePath = @resolveRootFilePath(filePath)
    args = builder.constructArgs(rootFilePath)

    @destroyErrorIndicator()
    @showProgressIndicator()

    new Promise((resolve, reject) =>
      showBuildError = (statusCode, result, builder) =>
        @showError(statusCode, result, builder)
        reject(statusCode)

      processBuildResult = (statusCode) =>
        result = builder.parseLogFile(rootFilePath)
        return showBuildError(statusCode, result, builder) unless result?.outputFilePath?

        @moveResult(result, rootFilePath) if @shouldMoveResult()
        @showResult(result)
        resolve(statusCode)

      builder.run(args)
        .then(processBuildResult)
        .catch(showBuildError)
        .then => @destroyProgressIndicator()
    )

  sync: ->
    {filePath, lineNumber} = @getEditorDetails()
    return unless filePath? and @isTexFile(filePath)

    unless outputFilePath = @resolveOutputFilePath(filePath)
      latex.log.warning('Could not resolve path to output file associated with the current file.')
      return

    if opener = latex.getOpener()
      opener.open(outputFilePath, filePath, lineNumber)

  # NOTE: Does not support `latex.outputDirectory` setting!
  clean: ->
    {filePath} = @getEditorDetails()

    unless filePath? and @isTexFile(filePath)
      return Promise.reject()

    rootFilePath = @resolveRootFilePath(filePath)
    rootPath = path.dirname(rootFilePath)
    rootFile = path.basename(rootFilePath)
    rootFile = rootFile.substring(0, rootFile.lastIndexOf('.'))

    cleanExtensions = atom.config.get('latex.cleanExtensions')
    Promise.all cleanExtensions.map (extension) ->
      candidatePath = path.join(rootPath, rootFile + extension)
      new Promise((resolve) ->
        fs.remove candidatePath, (error) ->
          resolve({filePath: candidatePath, error: error})
      )

  setStatusBar: (statusBar) ->
    @statusBar = statusBar

  moveResult: (result, filePath) ->
    originalFilePath = result.outputFilePath
    result.outputFilePath = @alterParentPath(filePath, result.outputFilePath)
    if fs.existsSync(originalFilePath)
      fs.moveSync(originalFilePath, result.outputFilePath)

    syncFilePath = originalFilePath.replace(/\.pdf$/, '.synctex.gz')
    if fs.existsSync(syncFilePath)
      fs.moveSync(syncFilePath, @alterParentPath(filePath, syncFilePath))

  resolveRootFilePath: (filePath) ->
    MasterTexFinder = require './master-tex-finder'
    finder = new MasterTexFinder(filePath)
    finder.getMasterTexPath()

  resolveOutputFilePath: (filePath) ->
    rootFilePath = @resolveRootFilePath(filePath)

    unless outputFilePath = @outputLookup?[filePath]
      builder = latex.getBuilder()
      result = builder.parseLogFile(rootFilePath)
      unless outputFilePath = result?.outputFilePath
        latex.log.warning('Log file parsing failed!')
        return
      @outputLookup ?= {}
      @outputLookup[filePath] = outputFilePath

    outputFilePath = @alterParentPath(rootFilePath, outputFilePath) if @shouldMoveResult()
    outputFilePath

  showResult: (result) ->
    if @shouldOpenResult() and opener = latex.getOpener()
      {filePath, lineNumber} = @getEditorDetails()
      opener.open(result.outputFilePath, filePath, lineNumber)

  showError: (statusCode, result, builder) ->
    @showErrorIndicator()
    latex.log.error(statusCode, result, builder)

  showProgressIndicator: ->
    return @indicator if @indicator?

    ProgressIndicatorView = require './views/progress-indicator-view'
    @indicator = new ProgressIndicatorView()
    @statusBar?.addRightTile({item: @indicator, priority: 9001})
    @indicator

  showErrorIndicator: ->
    return @errorIndicator if @errorIndicator?

    ErrorIndicatorView = require './views/error-indicator-view'
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
    filePath?.search(/\.(tex|lhs)$/) > 0

  getEditorDetails: ->
    editor = atom.workspace.getActiveTextEditor()
    return unless editor?

    editorDetails =
      editor: editor
      filePath: editor.getPath()
      lineNumber: editor.getCursorBufferPosition().row + 1

  alterParentPath: (targetPath, originalPath) ->
    targetDir = path.dirname(targetPath)
    path.join(targetDir, path.basename(originalPath))

  shouldMoveResult: -> atom.config.get('latex.moveResultToSourceDirectory')
  shouldOpenResult: -> atom.config.get('latex.openResultAfterBuild')
