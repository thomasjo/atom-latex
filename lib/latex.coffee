path = require "path"
runas = require "runas"

module.exports =
  activate: ->
    atom.workspaceView.command "latex:build", => @build()

  build: ->
    editor = atom.workspace.activePaneItem
    file = editor.buffer.file

    if file?
      dir = path.dirname(file.path)
      outdir = path.join(dir, "output") # TODO: Make this configurable.

      # TODO: Find a reasonable way to resolve `latexmk` regardless of platform.
      status = runas("/usr/texbin/latexmk", [
        "--pdf",
        "--f",
        "--interaction=nonstopmode",
        "--outdir=#{outdir}",
        file.path
      ])

      if status == 0
        # TODO: Display a more visible success message.
        console.info "Success!"
      else
        # TODO: Introduce proper error and warning handling.
        console.error "TeXification failed! Check the log file for more info..."
