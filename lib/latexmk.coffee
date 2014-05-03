child_process = require "child_process"
path = require "path"

module.exports =
  executable: "latexmk"

  run: (args, callback) ->
    command = "#{@executable} #{args.join(" ")}"
    options = env: PATH: @constructPath()

    # TODO: Add support for killing the process.
    proc = child_process.exec(command, options)
    proc.on "close", (code, signal) ->
      callback(code)
    proc

  constructArgs: (filePath) ->
    args = [
      "-interaction=nonstopmode"
      "-f"
      "-cd"
      "-pdf"
    ]

    pdfOpts = [
      "-synctex=1"
      "-file-line-error"
    ]

    enableShellEscape = atom.config.get("latex.enableShellEscape")
    pdfOpts.push("-shell-escape") if enableShellEscape?
    args.push("-pdflatex=\"pdflatex #{pdfOpts.join(" ")} %O %S\"")

    outdir = atom.config.get("latex.outputDirectory")
    if outdir?.length
      dir = path.dirname(filePath)
      outdir = path.join(dir, outdir)
      args.push("-outdir=#{outdir}")

    args.push(filePath)
    args

  constructPath: ->
    texPath = atom.config.get("latex.texPath")
    texPath?.replace("$PATH", process.env.PATH)
