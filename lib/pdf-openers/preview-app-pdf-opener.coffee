PdfOpener = require "./pdf-opener"
{exec} = require "child_process"


module.exports =
class PreviewAppPdfOpener extends PdfOpener
  open: (filePath, errorHandler, next) ->
    exec "open -a Preview " + filePath, (error, stdout, stderr) ->
      if error?
        errorHandler(error, stderr) if errorHandler?
        return

      next() if next?
