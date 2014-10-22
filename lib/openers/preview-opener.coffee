child_process = require 'child_process'
Opener = require '../opener'

module.exports =
class PreviewOpener extends Opener
  open: (filePath, callback) ->
    command = "open -g -a Preview.app #{filePath}"
    command = command.replace(/\-g\s/, '') unless @shouldOpenInBackground()
    child_process.exec command, (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?

  sync: (filePath, texPath, lineNumber, callback) ->
    console.info 'Preview.app does not support SyncTeX.'
    callback(1) if callback?
