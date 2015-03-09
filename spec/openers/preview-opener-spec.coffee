PreviewOpener = require '../../lib/openers/preview-opener'

describe "PreviewOpener", ->
  describe "open", ->
    # FIXME: Horrible test. Needs to be fixed, or removed entirely.
    it "invokes the callback with an exit code equal to `1` because the file is not found", ->
      exitCode = null
      opener = new PreviewOpener()
      opener.open 'dummy-file-name.pdf', (code) -> exitCode = code

      waitsFor ->
        exitCode > 0

      runs ->
        expect(exitCode).toEqual(1)
