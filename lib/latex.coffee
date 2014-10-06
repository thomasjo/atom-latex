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
    openResultAfterBuild:
      type: 'boolean'
      default: true
    openResultInBackground:
      type: 'boolean'
      default: true
    outputDirectory:
      description: "All files generated during a build will be redirected here"
      type: 'string'
      default: ''
    skimPath:
      type: 'string'
      default: '/Applications/Skim.app'
    texPath:
      title: 'TeX Path'
      description: "The path to your TeX distribution's bin directory"
      type: 'string'
      default: ''

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
      switch statusCode
        when 0 then @showResult(result)
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

    return new OpenerImpl() if OpenerImpl?
    console.info 'Opening PDF files is not yet supported on your platform.' unless atom.inSpecMode()

  resolveRootFilePath: (path) ->
    finder = new MasterTexFinder(path)
    finder.getMasterTexPath()

  shouldOpenResult: ->
    atom.config.get('latex.openResultAfterBuild')

  showResult: (result) ->
    if @shouldOpenResult() and opener = @getOpener()
      opener.open(result.outputFilePath)

    # TODO: Display a more visible success message.
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
