PreviewAppPdfOpener = require "../../lib/pdf-openers/preview-app-pdf-opener"

describe "PreviewAppPdfOpener", ->
  describe "open", ->
    it "calls the given error handler if the file is not found", ->
      opener = new PreviewAppPdfOpener()
      error = null
      stderr = null

      errorHandler = (err, errOutput) ->
        error = err
        stderr = errOutput

      runs ->
        opener.open("dummy-file-name.pdf", errorHandler, () -> return )

      waitsFor (->
        error != null
        ), "the error handler was not called", 500

      runs ->
        expect(error).toNotBe(null)
        expect(error.code).toNotEqual(0)
        expect(stderr).toMatch(/dummy-file-name.pdf does not exist\./)
