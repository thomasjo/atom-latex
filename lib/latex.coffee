_ = require 'underscore-plus'
fs = require 'fs-plus'
path = require 'path'
LatexmkBuilder = require './builders/latexmk'
MasterTexFinder = require './master-tex-finder'

ErrorIndicatorView = require './error-indicator-view'
ProgressIndicatorView = require './progress-indicator-view'

ConfigSchema = _.clone(require('./config-schema')) # Is the clone necessary?
module.exports =
  config: ConfigSchema

  activate: ->
    atom.commands.add 'atom-workspace', 'latex:build', => @build()
    atom.commands.add 'atom-workspace', 'latex:sync', => @sync()
    atom.commands.add 'atom-workspace', 'latex:clean', => @clean()

    atom.packages.once 'activated', =>
      @statusBar = document.querySelector('status-bar')

  build: ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      unless atom.inSpecMode()
        console.info 'File needs to be saved to disk before it can be TeXified.'
      return

    editor.save() if editor.isModified() # TODO: Make this configurable?

    builder = @getBuilder()
    rootFilePath = @resolveRootFilePath(filePath)
    args = builder.constructArgs(rootFilePath)

    @destroyErrorIndicator()
    @showProgressIndicator()
    proc = builder.run args, (statusCode) =>
      @destroyProgressIndicator()
      result = builder.parseLogFile(rootFilePath)
      @pdfFile = result.outputFilePath
      switch statusCode
        when 0
          @moveResult(result, rootFilePath) if @shouldMoveResult()
          @showResult(result)
        when 127 then @showError \
          """
          TeXification failed! Builder executable not found.

            latex.texPath
              as configured: #{atom.config.get('latex.texPath')}
              when resolved: #{builder.constructPath()}

          Make sure latex.texPath is configured correctly; either adjust it \
          via the settings view, or directly in your config.cson file.
          """
        else @showError \
          """
          TeXification failed with status code #{statusCode}! \
          Check the log file for more info...
          """

    return

  clean: ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      unless atom.inSpecMode()
        console.info 'File needs to be saved to disk before clean can find the project files.'
      return
    rootFilePath = @resolveRootFilePath(filePath)
    rootFile = path.basename(rootFilePath)
    rootFilePath = path.dirname(rootFilePath)

    rootFile = rootFile.split('.')
    rootFile.pop()
    rootFile = rootFile.join('.')

    cleanExtensions = atom.config.get('latex.cleanExtensions')
    unless cleanExtensions
      cleanExtensions = [
        '.aux'
        '.bbl'
        '.blg'
        '.fdb_latexmk'
        '.fls'
        '.log'
        '.synctex.gz'
        '.pdf'
        '.out'
      ]

    for extension in cleanExtensions
      fileToRemove = path.join(rootFilePath, rootFile + extension)
      if fs.existsSync(fileToRemove)
        fs.removeSync(fileToRemove)
        console.info 'LaTeX clean removed: ' + fileToRemove
      else
        console.info 'LaTeX clean did not find: ' + fileToRemove

  sync: ->
    unless @pdfFile?
      console.info 'File needs to be TeXified before SyncTeX can work.' unless atom.inSpecMode()
      return

    {filePath, lineNumber} = @getEditorDetails()
    opener = @getOpener()
    opener.open(@pdfFile, filePath, lineNumber)

  getEditorDetails: ->
    editor = atom.workspace.getActiveTextEditor()
    return unless editor?

    editorDetails =
      filePath: editor.getPath()
      lineNumber: editor.getCursorScreenPosition().row + 1

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
        console.info 'No PDF opener found.  For cross-platform viewing, install the pdf-view package.' unless atom.inSpecMode()
        return
    return new OpenerImpl()

  moveResult: (result, filePath) ->
    sourceDir = path.dirname(filePath)
    outputFilePath = result.outputFilePath
    result.outputFilePath = path.join(sourceDir, path.basename(outputFilePath))
    fs.moveSync(outputFilePath, result.outputFilePath)
    @pdfFile = result.outputFilePath

    syncFilePath = outputFilePath.replace(/.pdf$/, '.synctex.gz')
    if fs.existsSync(syncFilePath)
      fs.moveSync(syncFilePath, path.join(sourceDir, path.basename(syncFilePath)))

  resolveRootFilePath: (path) ->
    finder = new MasterTexFinder(path)
    finder.getMasterTexPath()

  shouldMoveResult: ->
    atom.config.get('latex.moveResultToSourceDirectory')

  shouldOpenResult: ->
    atom.config.get('latex.openResultAfterBuild')

  showResult: (result) ->
    if @shouldOpenResult() and opener = @getOpener()
      {filePath, lineNumber} = @getEditorDetails()
      opener.open(result.outputFilePath, filePath, lineNumber)

  showError: (error) ->
    # TODO: Introduce proper error and warning handling.
    console.error error unless atom.inSpecMode()
    @showErrorIndicator()

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
