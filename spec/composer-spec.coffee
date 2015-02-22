helpers = require './spec-helpers'
fs = require 'fs-plus'
path = require 'path'
Composer = require '../lib/composer'
LatexmkBuilder = require '../lib/builders/latexmk'

describe "Composer", ->
  [composer, fixturesPath] = []

  beforeEach ->
    fixturesPath = helpers.cloneFixtures()
    composer = new Composer(helpers.nullLogger())

  describe "build", ->
    [originalTimeoutInterval] = []

    beforeEach ->
      originalTimeoutInterval = helpers.setTimeoutInterval(10000)

      spyOn(composer, 'showResult').andCallThrough()
      spyOn(composer, 'getOpener').andReturn()

    afterEach ->
      helpers.setTimeoutInterval(originalTimeoutInterval)

    it "does nothing for new, unsaved files", ->
      spyOn(composer, 'build').andCallThrough()
      spyOn(composer, 'showError').andCallThrough()

      [result] = []
      waitsForPromise ->
        atom.workspace.open()

      runs ->
        result = composer.build()

      waitsFor ->
        composer.build.callCount is 1

      runs ->
        expect(result).toBe false
        expect(composer.showResult).not.toHaveBeenCalled()
        expect(composer.showError).not.toHaveBeenCalled()

    it "does nothing for unsupported file extensions", ->
      spyOn(composer, 'build').andCallThrough()
      spyOn(composer, 'showError').andCallThrough()

      [editor, result] = []
      waitsForPromise ->
        atom.workspace.open('file.md').then (ed) -> editor = ed

      runs ->
        editor.save()
        result = composer.build()

      waitsFor ->
        composer.build.callCount is 1

      runs ->
        expect(result).toBe false
        expect(composer.showResult).not.toHaveBeenCalled()
        expect(composer.showError).not.toHaveBeenCalled()

    it "runs `latexmk` for existing files", ->
      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        composer.build()

      waitsFor ->
        composer.showResult.callCount is 1

      runs ->
        expect(composer.showResult).toHaveBeenCalled()

    it "saves the file before building, if modified", ->
      [editor] = []
      waitsForPromise ->
        atom.workspace.open('file.tex').then (ed) -> editor = ed

      runs ->
        editor.moveToBottom()
        editor.insertNewline()
        composer.build()

      waitsFor ->
        composer.showResult.callCount is 1

      runs ->
        expect(editor.isModified()).toEqual(false)

    it "supports paths containing spaces", ->
      waitsForPromise ->
        atom.workspace.open('filename with spaces.tex')

      runs ->
        composer.build()

      waitsFor ->
        composer.showResult.callCount is 1

      runs ->
        expect(composer.showResult).toHaveBeenCalled()

    it "invokes `showResult` after a successful build, with expected log parsing result", ->
      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        composer.build()

      waitsFor ->
        composer.showResult.callCount is 1

      runs ->
        expect(composer.showResult).toHaveBeenCalledWith {
          outputFilePath: path.join(fixturesPath, 'file.pdf')
          errors: []
          warnings: []
        }

    it "treats missing output file data in log file as an error", ->
      class MockBuilder extends LatexmkBuilder
        parseLogFile: (texFilePath) ->
          result =
            outputFilePath: null
            errors: []
            warnings: []

      spyOn(composer, 'getBuilder').andReturn(new MockBuilder())
      spyOn(composer, 'showError').andCallThrough()

      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        composer.build()

      waitsFor ->
        composer.showError.callCount is 1

      runs ->
        expect(composer.showError).toHaveBeenCalled()

  describe "getOpener", ->
    originalPlatform = process.platform

    afterEach ->
      helpers.overridePlatform(originalPlatform)

    it "supports OS X", ->
      helpers.overridePlatform('darwin')
      opener = composer.getOpener()

      expect(opener.constructor.name).toEqual('PreviewOpener')

    it "does not support GNU/Linux", ->
      helpers.overridePlatform('linux')
      opener = composer.getOpener()

      expect(opener).toBeUndefined()

    it "does not support Windows", ->
      helpers.overridePlatform('win32')
      opener = composer.getOpener()

      expect(opener).toBeUndefined()

    it "does not support unknown operating system", ->
      helpers.overridePlatform('foo')
      opener = composer.getOpener()

      expect(opener).toBeUndefined()

    it "returns SkimOpener when installed on OS X", ->
      atom.config.set('latex.skimPath', '/Applications/Skim.app')
      helpers.overridePlatform('darwin')

      existsSync = fs.existsSync
      spyOn(fs, 'existsSync').andCallFake (filePath) ->
        return true if filePath is '/Applications/Skim.app'
        existsSync(filePath)

      opener = composer.getOpener()

      expect(opener.constructor.name).toEqual('SkimOpener')

    it "returns PreviewOpener when Skim is not installed on OS X", ->
      atom.config.set('latex.skimPath', '/foo/Skim.app')
      helpers.overridePlatform('darwin')
      opener = composer.getOpener()

      expect(opener.constructor.name).toEqual('PreviewOpener')
