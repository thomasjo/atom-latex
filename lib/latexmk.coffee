child_process = require "child_process"
path = require "path"

module.exports =
  run: (path, args) ->
    # TODO: Add support for killing the process.
    proc = child_process.exec(path + " " + args.join(" "))

    proc.on "close", (code, signal) =>
      if code == 0
        # TODO: Display a more visible success message.
        console.info "Success!" unless atom.inSpecMode()
      else
        # TODO: Introduce proper error and warning handling.
        console.error "TeXification failed! Check the log file for more info..." unless atom.inSpecMode()

    proc

  constructArgs: (filePath) ->
    args = [
      "-interaction=nonstopmode"
      "-f"
      "-cd"
      "-pdf"
    ]

    pdfOpts = [] # TODO: Add default opts (-synctex=1, -file-line-error, ...)
    enableShellEscape = atom.config.get("latex.enableShellEscape")
    pdfOpts.push("-shell-escape %O %S") if enableShellEscape?

    args.push("--pdflatex=\"pdflatex #{pdfOpts.join(" ")}\"")

    dir = path.dirname(filePath)
    outdir = atom.config.get("latex.outputDirectory")
    if outdir?.length
      outdir = path.join(dir, outdir)
      args.push("-outdir=#{outdir}")

    args.push(filePath)
    args
