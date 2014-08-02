PreviewAppPdfOpener = require "./preview-app-pdf-opener"
{platform} = require "os"

module.exports =
class PdfOpeners
  # Returns an appropriate pdf-opener given the current OS, available applications
  # and user preferences.
  # TODO: implement it properly. Currently it works only on OS X.
  @getOpener: ->
    switch platform()
      when "darwin" then new PreviewAppPdfOpener()
      else
        console.info("opening pdfs is still not supported on your platform")
        null
