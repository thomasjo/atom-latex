child_process = require 'child_process'
Opener = require '../opener'

module.exports =
class PreviewOpener extends Opener
  open: (filePath, callback) ->
    child_process.exec "open -a Preview.app #{filePath}", (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?
