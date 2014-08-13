path = require 'path'
ErrorIndicatorView = require './error-indicator-view'
LatexmkBuilder = require './builders/latexmk'
MasterTexFinder = require './master-tex-finder'
ProgressIndicatorView = require './progress-indicator-view'

module.exports =
  configDefaults:
    enableShellEscape: false
    outputDirectory: ''
    texPath: ''

  activate: ->
    atom.workspaceView.command 'latex:build', => @build()

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
      if statusCode == 0
        @showResult(result)
      else if statusCode == 127
        @showError \
          """
          TeXification failed! Builder executable not found.

            latex.texPath
              as configured: #{atom.config.get('latex.texPath')}
              when resolved: #{builder.constructPath()}

          Make sure latex.texPath is configured correctly; either adjust it \
          via the settings view, or directly in your config.cson file.
          """
      else
        @showError \
          """
          TeXification failed with status code #{statusCode}! \
          Check the log file for more info...
          """

    return

  getBuilder: ->
    new LatexmkBuilder()

  getOpener: ->
    switch process.platform
      when 'darwin'
        PreviewAppPdfOpener = require './pdf-openers/preview-app-pdf-opener'
        new PreviewAppPdfOpener()
      else
        console.info 'Opening PDF files is not yet supported on your platform.'

  resolveRootFilePath: (path) ->
    finder = new MasterTexFinder(path)
    finder.getMasterTexPath()

  showResult: (result) ->
    # TODO: Display a more visible success message.
    opener.open(result.outputFilePath) if opener = @getOpener()
    console.info 'Success!' unless atom.inSpecMode()

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
