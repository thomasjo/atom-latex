WrapCommands =
  command: 1
  environment: 2
  emph: 3
  bold: 4
  texttt: 5
  underline: 6

String::startsWith ?= (s) -> @[...s.length] is s
String::endsWith ?= (s) -> s is '' or @[-s.length..] is s

class CommandWrapper
  constructor: ->

  activate: ->
    atom.commands.add 'atom-workspace', 'latex:wrap-in-command', => @wrapIn(WrapCommands.command)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-emph', => @wrapIn(WrapCommands.emph)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-bold', => @wrapIn(WrapCommands.bold)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-underline', => @wrapIn(WrapCommands.underline)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-texttt', => @wrapIn(WrapCommands.texttt)
    atom.commands.add 'atom-workspace', 'latex:wrap-in-environment', => @wrapIn(WrapCommands.environment)
    atom.commands.add 'atom-workspace', 'latex:insert-command', => @insertCommand()
    atom.commands.add 'atom-workspace', 'latex:insert-environment', => @insertEnvironment()

  getNewLineChar: (editor, cursor) ->
    range = cursor.selection.getBufferRange()
    nLine = editor.buffer.lineEndingForRow(Math.max(range.start.row, range.end.row))
    unless nLine
      editor.buffer.lineEndingForRow(0)
    unless nLine
      # here we default to \n
      nLine = '\n'
    return nLine

  getActiveEditor: ->
    return atom.workspace.getActivePaneItem()

  isInLaTeXMode: ->
    grammarName = @getActiveEditor().getGrammar().name
    return grammarName == "TeX" or grammarName.startsWith("LaTeX")

  wrapIn: (c) ->
    unless @isInLaTeXMode()
      return
    editor = atom.workspace.getActivePaneItem()
    filePath = editor?.getPath()
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

  insertCommand: ->
    unless @isInLaTeXMode()
      return
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
    unless @isInLaTeXMode()
      return
    editor = atom.workspace.getActiveEditor()
    cursors = editor.getCursors()
    nLine = @getNewLineChar(editor, cursors[0])
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
    nLine = @getNewLineChar(editor, cursor)
    selection.insertText "\\begin{env}#{nLine}#{txt}#{nLine}\\end{env}", {autoIndent: true}
    # the cursor will now be after the Selection
    cursor.moveLeft "env}".length
    selection.selectRight "env".length
    sndCursor = editor.addCursorAtBufferPosition range.start
    sndCursor.moveRight "\\begin{".length
    sndCursor.selection.selectRight "env".length

module.exports =
  CommandWrapper
