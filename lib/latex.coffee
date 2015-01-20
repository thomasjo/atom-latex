fs = require 'fs-plus'
path = require 'path'
ErrorIndicatorView = require './error-indicator-view'
LatexmkBuilder = require './builders/latexmk'
MasterTexFinder = require './master-tex-finder'
ProgressIndicatorView = require './progress-indicator-view'

module.exports =
  config:
    enableShellEscape:
      type: 'boolean'
      default: false
    moveResultToSourceDirectory:
      description: 'Ensures that the output file produced by a successful build
        is stored together with the TeX document that produced it.'
      type: 'boolean'
      default: true
    openResultAfterBuild:
      type: 'boolean'
      default: true
    openResultInBackground:
      type: 'boolean'
      default: true
    outputDirectory:
      description: 'All files generated during a build will be redirected here.
        Leave blank if you want the build output to be stored in the same
        directory as the TeX document.'
      type: 'string'
      default: ''
    skimPath:
      type: 'string'
      default: '/Applications/Skim.app'
    texPath:
      title: 'TeX Path'
      description: "The full path to your TeX distribution's bin directory."
      type: 'string'
      default: ''

  activate: (state) ->
    @pdfFile = state.pdfFile if state?
    atom.workspaceView.command 'latex:build', => @build()
    atom.workspaceView.command 'latex:sync', => @sync()

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

  sync: ->
    unless @pdfFile?
      console.info 'File needs to be TeXified before SyncTeX can work.' unless atom.inSpecMode()
      return
    editor = atom.workspace.getActivePaneItem()
    texFile = editor?.getPath()
    lineNumber = editor?.getCursorBufferPosition().toArray()[0] + 1

    opener = @getOpener()
    opener.open(@pdfFile, texFile, lineNumber)

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
      when 'linux'
        require './openers/xdg-opener'

    return new OpenerImpl() if OpenerImpl?
    console.info 'Opening PDF files is not yet supported on your platform.' unless atom.inSpecMode()

  moveResult: (result, filePath) ->
    sourceDir = path.dirname(filePath)
    outputFilePath = result.outputFilePath
    result.outputFilePath = path.join(sourceDir, path.basename(outputFilePath))
    fs.moveSync(outputFilePath, result.outputFilePath)

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
      opener.open(result.outputFilePath)

  showError: (error) ->
    # TODO: Introduce proper error and warning handling.
    console.error error unless atom.inSpecMode()
    @showErrorIndicator()

  showProgressIndicator: ->
    return @indicator if @indicator?

    @indicator = new ProgressIndicatorView()
    atom.workspaceView.statusBar?.prependRight(@indicator)
    @indicator

  showErrorIndicator: ->
    return @errorIndicator if @errorIndicator?

    @errorIndicator = new ErrorIndicatorView()
    atom.workspaceView.statusBar?.prependRight(@errorIndicator)
    @errorIndicator

  destroyProgressIndicator: ->
    @indicator?.destroy()
    @indicator = null

  destroyErrorIndicator: ->
    @errorIndicator?.destroy()
    @errorIndicator = null

  serialize: ->
    return { pdfFile: @pdfFile }
