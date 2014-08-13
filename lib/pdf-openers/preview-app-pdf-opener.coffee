child_process = require 'child_process'
PdfOpener = require '../pdf-opener'

module.exports =
class PreviewAppPdfOpener extends PdfOpener
  open: (filePath, callback) ->
    child_process.exec "open -a Preview.app #{filePath}", (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?
