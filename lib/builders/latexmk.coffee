child_process = require 'child_process'
fs = require 'fs-plus'
path = require 'path'
Builder = require '../builder'
LogParser = require '../parsers/log-parser'

module.exports =
class LatexmkBuilder extends Builder
  run: (args, callback) ->
    command = "latexmk #{args.join(' ')}"
    options = @constructChildProcessOptions()
    options.env['max_print_line'] = 1000  # Max log file line length.

    # TODO: Add support for killing the process.
    proc = child_process.exec command, options, (error, stdout, stderr) ->
      if error?
        callback(error.code)
      else
        callback(0)
    proc

  constructArgs: (filePath) ->
    args = [
      '-interaction=nonstopmode'
      '-f'
      '-cd'
      '-pdf'
      '-synctex=1'
      '-file-line-error'
    ]

    enableShellEscape = atom.config.get('latex.enableShellEscape')
    customEngine = atom.config.get('latex.customEngine')
    engine = atom.config.get('latex.engine')

    args.push('-shell-escape') if enableShellEscape?

    if customEngine
      args.push("-pdflatex=\"#{customEngine}\"")
    else if engine? and engine isnt 'pdflatex'
      args.push("-#{engine}")

    if outdir = atom.config.get('latex.outputDirectory')
      dir = path.dirname(filePath)
      outdir = path.join(dir, outdir)
      args.push("-outdir=\"#{outdir}\"")

    args.push("\"#{filePath}\"")
    args

  parseLogFile: (texFilePath) ->
    logFilePath = @resolveLogFilePath(texFilePath)
    return unless fs.existsSync(logFilePath)

    parser = new LogParser(logFilePath)
    result = parser.parse()
