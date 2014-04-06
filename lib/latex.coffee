path = require "path"
latexmk = require "./latexmk"

module.exports =
  configDefaults:
    latexmkPath: "/usr/texbin/latexmk"
    outputDirectory: ""
    enableShellEscape: false

  activate: ->
    atom.workspaceView.command "latex:build", => @build()

  # TODO: Now that we're async, should we always return a promise or some such?
  build: ->
    editor = atom.workspace.activePaneItem
    file = editor?.buffer.file

    unless file?
      return -1 # Magic value... replace?

    # Save file if it's dirty. Should this be configurable?
    editor.save() if editor.isModified()

    # TODO: Find a reasonable way to resolve `latexmk` regardless of platform.
    latexmkPath = atom.config.get("latex.latexmkPath")
    args = latexmk.constructArgs(file.path)
    proc = latexmk.run(latexmkPath, args)
