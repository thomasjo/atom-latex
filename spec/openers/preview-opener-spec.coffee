PreviewOpener = require '../../lib/openers/preview-opener'

describe "PreviewOpener", ->
  describe "open", ->
    it "invokes the callback with an exit code equal to `1` because the file is not found", ->
      exitCode = null
      opener = new PreviewOpener()
      opener.open 'dummy-file-name.pdf', (code) -> exitCode = code

      waitsFor ->
        exitCode > 0

      runs ->
        expect(exitCode).toEqual(1)

  describe "sync", ->
    it "invokes the callback with an exit code equal to `1` because Preview.app does not support SyncTeX", ->
      exitCode = null
      opener = new PreviewOpener()
      opener.sync 'dummy-file-name.pdf', 'dummy-file-name.tex', 1, (code) -> exitCode = code

      waitsFor ->
        exitCode > 0

      runs ->
        expect(exitCode).toEqual(1)
