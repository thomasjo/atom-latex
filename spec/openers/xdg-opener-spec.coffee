XdgOpener = require '../../lib/openers/xdg-opener'

describe "XdgOpener", ->
  describe "open", ->
    it "invokes the callback with an exit code equal to `1` because the file is not found", ->
      exitCode = null
      opener = new XdgOpener()
      opener.open 'dummy-file-name.pdf', (code) -> exitCode = code

      waitsFor ->
        exitCode > 0

      runs ->
        expect(exitCode).toEqual(2)
