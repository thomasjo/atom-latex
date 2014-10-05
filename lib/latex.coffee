fs = require 'fs-plus'
path = require 'path'
CSON = require 'season'
ErrorIndicatorView = require './error-indicator-view'
LatexmkBuilder = require './builders/latexmk'
MasterTexFinder = require './master-tex-finder'
ProgressIndicatorView = require './progress-indicator-view'

module.exports =
  configDefaults:
    enableShellEscape: false
    openResultAfterBuild: true
    openResultInBackground: true
    outputDirectory: ''
    skimPath: '/Applications/Skim.app'
    texPath: ''

  activate: ->
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
      @setOutputFilePath(result.outputFilePath)
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

  sync: ->
    pdfFile = @getOutputFilePath()
    unless pdfFile?
      console.info 'File needs to be TeXified before SyncTeX can work.' unless atom.inSpecMode()
      return
    editor = atom.workspace.getActivePaneItem()
    texFile = editor?.getPath()
    lineNumber = editor?.getCursorBufferPosition().toArray()[0] + 1

    opener = @getOpener()
    opener.sync(pdfFile, texFile, lineNumber)

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

  getConfigFilePath: ->
    filePath = path.join(atom.getConfigDirPath(), latex.cson)
    unless fs.existsSync(filePath)
      CSON.writeFileSync(filePath, {})
    return filePath

  setOutputFilePath: (filePath) ->
    configFile = @getConfigFilePath()
    data = CSON.readFileSync(configFile) || {}
    data[atom.project.getPath()] = filePath
    CSON.writeFileSync(configFile, data)

  getOutputFilePath: ->
    filePath = null
    configFile = @getConfigFilePath()
    data = CSON.readFileSync(configFile) || {}
    filePath = data[atom.project.getPath()]

    return unless filePath?
    unless fs.existsSync(filePath)
      setOutputFilePath(null)
      filePath = null

    return filePath
