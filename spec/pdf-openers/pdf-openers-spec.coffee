{platform} = require "os"
PdfOpeners = require "../../lib/pdf-openers/pdf-openers"

describe "PdfOpeners", ->
  describe "getOpener", ->
    it "supports OS X", ->
      expect(PdfOpeners.getOpener()).toNotBe(null) if platform() == "darwin"
