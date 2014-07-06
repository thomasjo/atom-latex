child_process = require "child_process"
path = require "path"
Builder = require "../builder"

module.exports =
class LatexmkBuilder extends Builder
  run: (args, callback) ->
    command = "latexmk #{args.join(" ")}"
    options = @constructChildProcessOptions()
    options.env["max_print_line"] = 1000  # Max log file line length.

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
      args.push("-outdir=\"#{outdir}\"")

    args.push("\"#{filePath}\"")
    args
