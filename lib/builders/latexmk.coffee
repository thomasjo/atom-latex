child_process = require "child_process"
path = require "path"
MasterTexFinder = require '../master-tex-finder'

Builder = require "../builder"
MasterTexFinder = require "../master-tex-finder"

module.exports =
class LatexmkBuilder extends Builder
  run: (args, callback) ->
    command = "latexmk #{args.join(" ")}"
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
      args.push("-outdir=\"#{outdir}\"")

    masterTexPath = new MasterTexFinder(filePath).masterTexPath()

    unless masterTexPath is null
      args.push("\"#{masterTexPath}\"")
    else
      args.push("\"#{filePath}\"")
      console.error "Cannot find latex master file"

    args
