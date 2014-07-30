path = require "path"
LatexmkBuilder = require "./builders/latexmk"
MasterTexFinder = require "./master-tex-finder"
ProgressIndicatorView = require "./progress-indicator-view"
ErrorIndicatorView = require "./error-indicator-view"

module.exports =
  configDefaults:
    texPath: "$PATH:/usr/texbin"
    outputDirectory: ""
    enableShellEscape: false

  activate: ->
    atom.workspaceView.command "latex:build", => @build()

  build: ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      # TODO: Show info message that the file has to be saved once?
      return

    editor.save() if editor.isModified() # NOTE: Should this be configurable?

    builder = @getBuilder()
    rootFilePath = @resolveRootFilePath(filePath)
    args = builder.constructArgs(rootFilePath)

    @destroyErrorIndicator()
    @showProgressIndicator()
    proc = builder.run args, (statusCode) =>
      @destroyProgressIndicator()
      if statusCode == 0
        @showResult()
      else if statusCode == 127
        @showError(
          """
          TeXification failed! Builder executable not found.

            latex.texPath
              as configured: #{atom.config.get("latex.texPath")}
              when resolved: #{builder.constructPath()}

          Make sure latex.texPath is configured correctly; either adjust it \
          via the settings view, or directly in your config.cson file.
          """
        )
      else
        @showError(
          """
          TeXification failed with status code #{statusCode}! \
          Check the log file for more info...
          """
        )

    return

  getBuilder: ->
    new LatexmkBuilder

  resolveRootFilePath: (path) ->
    finder = new MasterTexFinder(path)
    finder.getMasterTexPath()

  showResult: ->
    # TODO: Display a more visible success message.
    console.info "Success!" unless atom.inSpecMode()

  showError: (error) ->
    # TODO: Introduce proper error and warning handling.
    console.error error unless atom.inSpecMode()
    @showErrorIndicator()

  showProgressIndicator: ->
    return @indicator if @indicator?

    @indicator = new ProgressIndicatorView
    atom.workspaceView.statusBar?.prependRight(@indicator)
    @indicator

  showErrorIndicator: ->
    return @errorIndicator if @errorIndicator?

    @errorIndicator = new ErrorIndicatorView
    atom.workspaceView.statusBar?.prependRight(@errorIndicator)
    @errorIndicator

  destroyProgressIndicator: ->
    @indicator?.destroy()
    @indicator = null

  destroyErrorIndicator: ->
    @errorIndicator?.destroy()
    @errorIndicator = null
