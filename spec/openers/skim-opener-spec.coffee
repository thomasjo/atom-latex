PreviewOpener = require '../../lib/openers/skim-opener'

describe "SkimOpener", ->
  describe "open", ->
    it "invokes the callback with an exit code equal to `1` because the file is not found", ->
      exitCode = null
      opener = new SkimOpener()
      opener.open 'dummy-file-name.pdf', (code) -> exitCode = code

      waitsFor -> exitCode > 0
      runs -> expect(exitCode).toEqual(1)
