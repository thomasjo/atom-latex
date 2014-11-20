child_process = require 'child_process'
Opener = require '../opener'

module.exports =
class PreviewOpener extends Opener
  open: (filePath, texPath, lineNumber, callback) ->
    callback = texPath if typeof texPath is 'function'

    command = "xdg-open #{filePath}"
    child_process.exec command, (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?
