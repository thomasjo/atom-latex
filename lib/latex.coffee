path = require "path"
latexmk = require "./latexmk"

module.exports =
  configDefaults:
    latexmkPath: "/usr/texbin/latexmk"
    outputDirectory: ""

  activate: ->
    atom.workspaceView.command "latex:build", => @build()

  # TODO: Now that we're async, we need to always return a promise or some such.
  build: ->
    editor = atom.workspace.activePaneItem
    file = editor?.buffer.file

    unless file?
      return -1 # Magic value... replace?

    # Save file if it's dirty. Should this be configurable?
    editor.save() if editor.isModified()

    # TODO: Find a reasonable way to resolve `latexmk` regardless of platform.
    latexmkPath = atom.config.get("latex.latexmkPath")

    args = [
      "--pdf"
      "--f"
      "--interaction=nonstopmode"
      "--cd"
      file.path
    ]

    dir = path.dirname(file.path)
    outdir = atom.config.get("latex.outputDirectory")
    if outdir?.length
      outdir = path.join(dir, outdir)
      args[-1..] = ["--outdir=#{outdir}"].concat(args[-1..])

    proc = latexmk.run(latexmkPath, args)
