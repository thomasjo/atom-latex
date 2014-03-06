path = require "path"
runas = require "runas"

module.exports =
  activate: ->
    atom.workspaceView.command "latex:build", => @build()

  build: ->
    editor = atom.workspace.activePaneItem
    # console.debug editor

    file = editor.buffer.file
    # console.debug file

    if file?
      # file = editor.getUri()
      dir = path.dirname(file.path)
      outdir = path.join(dir, "output")
      # console.debug outdir

      code = runas("/usr/texbin/latexmk", ["--pdf", "--f", "--interaction=nonstopmode", "--outdir=#{outdir}", file.path])
      # console.debug code
