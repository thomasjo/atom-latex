child_process = require 'child_process'
Opener = require '../opener'

module.exports =
class SkimOpener extends Opener
  open: (filePath, callback) ->
    command = "open -g -a Skim.app #{filePath}"
    command = command.replace(/\-g\s/, '') unless @shouldOpenInBackground()
    child_process.exec command, (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?
