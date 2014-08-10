PreviewAppPdfOpener = require "../../lib/pdf-openers/preview-app-pdf-opener"

describe "PreviewAppPdfOpener", ->
  describe "open", ->
    it "invokes the callback with an exit code equal to `1` because the file is not found", ->
      exitCode = null
      opener = new PreviewAppPdfOpener
      opener.open "dummy-file-name.pdf", (code) -> exitCode = code

      waitsFor -> exitCode > 0
      runs -> expect(exitCode).toEqual(1)
