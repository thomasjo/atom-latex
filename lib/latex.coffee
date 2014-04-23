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
    envPath = process.env.PATH
    texPath = atom.config.get("latex.texPath")
    texPathSansMarker = texPath?.replace("$PATH", "")
    if texPath? and texPath.length == texPathSansMarker.length
      console.error "latex.texPath MUST contain $PATH at some point"
      return -1

    hasAllPaths = texPathSansMarker?.split(":").every (path) ->
      envPath.indexOf(path) > -1

    process.env.PATH = texPath.replace("$PATH", envPath) unless hasAllPaths

  build: ->
    editor = atom.workspace.activePaneItem
    file = editor?.buffer.file
    unless file?
      return -1

    editor.save() if editor.isModified() # NOTE: Should this be configurable?
    args = latexmk.constructArgs(file.path)
    proc = latexmk.run(args) # TODO: Trigger an event instead of returning proc?
