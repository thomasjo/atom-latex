_ = require 'underscore-plus'
fs = require 'fs-plus'
path = require 'path'
wrap = require 'wordwrap'
LatexmkBuilder = require './builders/latexmk'
MasterTexFinder = require './master-tex-finder'

ErrorIndicatorView = require './error-indicator-view'
ProgressIndicatorView = require './progress-indicator-view'

WrapCommands =
  command: 1
  environment: 2
  emph: 3
  bold: 4
  texttt: 5
  underline: 6

ConfigSchema = _.clone(require('./config-schema')) # Is the clone necessary?
module.exports =
  config: ConfigSchema

  activate: ->
    atom.commands.add 'atom-workspace', 'latex:build', => @build()
    atom.commands.add 'atom-workspace', 'latex:sync', => @sync()
    atom.commands.add 'atom-workspace', 'latex:clean', => @clean()
    atom.commands.add 'atom-workspace', 'latex:wrap', => @wrap()
    atom.commands.add 'atom-workspace', 'latex:wrap-in-command', => @wrapIn(WrapCommands.command)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-emph', => @wrapIn(WrapCommands.emph)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-bold', => @wrapIn(WrapCommands.bold)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-underline', => @wrapIn(WrapCommands.underline)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-texttt', => @wrapIn(WrapCommands.texttt)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-environment', => @wrapIn(WrapCommands.environment)
    atom.commands.add 'atom-workspace', 'latex:insert-command', => @insertCommand()
    atom.commands.add 'atom-workspace', 'latex:insert-environment', => @insertEnvironment()

    atom.packages.once 'activated', =>
      @statusBar = document.querySelector('status-bar')

  build: ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      unless atom.inSpecMode()
        console.info 'File needs to be saved to disk before it can be TeXified.'
      return false

    unless @isTexFile(filePath)
      unless atom.inSpecMode()
        extension = path.extname(filePath)
        console.info "File does not seem to be a TeX file; unsupported extension '#{extension}'."
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

      unless result.outputFilePath?
        @showError(statusCode, result, builder)
        return false

      @moveResult(result, rootFilePath) if @shouldMoveResult()
      @showResult(result)

    return true

  wrap: ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      return false
    unless @isTexFile(filePath)
      unless atom.inSpecMode()
        extension = path.extname(filePath)
        console.info "File does not seem to be a TeX file; unsupported extension '#{extension}'"
      return false
    preferredLineLength = atom.config.get('editor.preferredLineLength')
    editor.transact () ->
      lineCount = editor.getLineCount()
      lastLineLength = editor.lineTextForBufferRow(lineCount - 1).length
      regexp = RegExp("^(.){" + preferredLineLength + ",}$", "g")
      editor.backwardsScanInBufferRange regexp, [[0,1], [lineCount - 1, lastLineLength - 1]], (match) ->
        w = wrap preferredLineLength
        match.replace w(match.matchText)

  insertCommand: ->
    editor = atom.workspace.getActiveEditor()
    cursors = editor.getCursors()
    for cursor in cursors
      selection = cursor.selection
      selectionRange = selection.getBufferRange()
      selection.selectWord()
      txt = selection.getText()
      selection.insertText "\\#{txt}{}"
      cursor.moveLeft 1

  insertEnvironment: ->
    editor = atom.workspace.getActiveEditor()
    cursors = editor.getCursors()
    range = cursors[0].selection.getBufferRange()
    nLine = editor.buffer.lineEndingForRow(Math.max(range.start.row, range.end.row))
    unless nLine
      editor.buffer.lineEndingForRow(0)
    unless nLine
      # here we default to \n
      nLine = '\n'
    for cursor in cursors
      selection = cursor.selection
      selectionRange = selection.getBufferRange()
      selection.selectWord()
      txt = selection.getText()
      selection.insertText "\\begin{#{txt}}#{nLine}#{nLine}\\end{#{txt}}"
      cursor.moveUp 1

  wrapInCommand: (cursor) ->
    selection = cursor.selection
    txt = selection.getText()
    unless txt.length
      return
    newText = "cmd{#{txt}}"
    selection.insertText "\\#{newText}"
    cursor.moveLeft newText.length
    selection.selectRight "cmd".length

  wrapInGivenCommand: (cursor, cmd) ->
    selection = cursor.selection
    txt = selection.getText()
    selection.insertText "\\#{cmd}{#{txt}}"
    cursor.moveLeft 1
    selection.selectLeft txt.length

  wrapInEnvironment: (editor, cursor) ->
    selection = cursor.selection
    txt = selection.getText()
    range = selection.getBufferRange()
    nLine = editor.buffer.lineEndingForRow(Math.max(range.start.row, range.end.row))
    unless nLine
      editor.buffer.lineEndingForRow(0)
    unless nLine
      # here we default to \n
      nLine = '\n'
    selection.insertText "\\begin{env}#{nLine}#{txt}#{nLine}\\end{env}", {autoIndent: true}
    # the cursor will now be after the Selection
    cursor.moveLeft "env}".length
    selection.selectRight "env".length
    sndCursor = editor.addCursorAtBufferPosition range.start
    sndCursor.moveRight "\\begin{".length
    sndCursor.selection.selectRight "env".length

  wrapIn: (c) ->
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
    unless filePath?
      return false
    unless @isTexFile(filePath)
      unless atom.inSpecMode()
        extension = path.extname(filePath)
        console.info "File does not seem to be a TeX file; unsupported extension '#{extension}'"
      return false
    cursors = editor.getCursors()
    editor.transact () =>
      for cursor in cursors
        switch c
          when WrapCommands.command then @wrapInCommand cursor
          when WrapCommands.emph then @wrapInGivenCommand cursor, "emph"
          when WrapCommands.bold then @wrapInGivenCommand cursor, "textbf"
          when WrapCommands.underline then @wrapInGivenCommand cursor, "underline"
          when WrapCommands.texttt then @wrapInGivenCommand cursor, "texttt"
          when WrapCommands.environment then @wrapInEnvironment editor, cursor

  # TODO: Improve overall code quality within this function.
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
    {filePath, lineNumber} = @getEditorDetails()

    unless outputFilePath = @resolveOutputFilePath(filePath)
      unless atom.inSpecMode()
        console.info 'Could not resolve path to output file associated with the current file.'
      return

    if opener = @getOpener()
      opener.open(outputFilePath, filePath, lineNumber)

  isTexFile: (filePath) ->
    # TODO: Improve; will suffice for the time being.
    return filePath?.search(/\.(tex|lhs)$/) > 0

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
        console.info 'No PDF opener found. For cross-platform viewing,
          install the pdf-view package.' unless atom.inSpecMode()
        return
    return new OpenerImpl()

  moveResult: (result, filePath) ->
    originalFilePath = result.outputFilePath
    result.outputFilePath = @alterParentPath(filePath, result.outputFilePath)
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
        console.info 'Log file parsing failed!' unless atom.inSpecMode()
        return
      @outputLookup ?= {}
      @outputLookup[filePath] = outputFilePath

    outputFilePath = @alterParentPath(rootFilePath, outputFilePath) if @shouldMoveResult()
    outputFilePath

  alterParentPath: (targetPath, originalPath) ->
    targetDir = path.dirname(targetPath)
    path.join(targetDir, path.basename(originalPath))

  shouldMoveResult: ->
    atom.config.get('latex.moveResultToSourceDirectory')

  shouldOpenResult: ->
    atom.config.get('latex.openResultAfterBuild')

  showResult: (result) ->
    if @shouldOpenResult() and opener = @getOpener()
      {filePath, lineNumber} = @getEditorDetails()
      opener.open(result.outputFilePath, filePath, lineNumber)

  showError: (statusCode, result, builder) ->
    @showErrorIndicator()
    return if atom.inSpecMode()

    console.group('LaTeX')
    switch statusCode
      when 127
        console.log(
          """
          %cTeXification failed! Builder executable not found.

            latex.texPath
              as configured: #{atom.config.get('latex.texPath')}
              when resolved: #{builder.constructPath()}

          Make sure latex.texPath is configured correctly; either adjust it \
          via the settings view, or directly in your config.cson file.
          """, 'color: red')
      else
        console.group("TeXification failed with status code #{statusCode}")
        for error in result.errors
          console.log("%c#{error.filePath}:#{error.lineNumber}: #{error.message}", 'color: red')
        console.groupEnd()
    console.groupEnd()

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
