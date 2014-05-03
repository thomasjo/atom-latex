path = require "path"
latexmk = require "./latexmk"

module.exports =
  configDefaults:
    texPath: "$PATH:/usr/texbin"
    outputDirectory: ""
    enableShellEscape: false

  activate: ->
    @initialize()
    atom.workspaceView.command "latex:build", => @build()

  initialize: ->
    atom.config.observe "latex.texPath", => @setPath()

  setPath: ->
    texPath = atom.config.get("latex.texPath")
    unless texPath?.indexOf("$PATH") >= 0
      console.error "latex.texPath MUST contain $PATH at some point"
      return
    @envPath = process.env.PATH unless @envPath?
    process.env.PATH = texPath.replace("$PATH", @envPath)

  build: ->
    editor = atom.workspace.activePaneItem
    file = editor?.buffer.file
    unless file?
      # TODO: Show info message that the file has to be saved once?
      return

    editor.save() if editor.isModified() # NOTE: Should this be configurable?
    args = latexmk.constructArgs(file.path)
    proc = latexmk.run(args) # TODO: Trigger an event instead of returning proc?
