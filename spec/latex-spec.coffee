helpers = require './spec-helpers'
fs = require 'fs-plus'
path = require 'path'
latex = require '../lib/latex'

describe "Latex", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = helpers.cloneFixtures()
    helpers.mockStatusBar()

  describe "build", ->
    beforeEach ->
      spyOn(latex, 'showResult').andCallThrough()
      spyOn(latex, 'getOpener').andReturn()

    it "does nothing for new, unsaved files", ->
      spyOn(latex, 'build').andCallThrough()
      spyOn(latex, 'showError').andCallThrough()

      waitsForPromise ->
        atom.workspace.open()

      runs ->
        latex.build()

      waitsFor ->
        latex.build.callCount == 1

      runs ->
        expect(latex.showResult).not.toHaveBeenCalled()
        expect(latex.showError).not.toHaveBeenCalled()

    it "runs `latexmk` for existing files", ->
      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        latex.build()

      waitsFor ->
        latex.showResult.callCount == 1

      runs ->
        expect(latex.showResult).toHaveBeenCalled()

    it "saves the file before building, if modified", ->
      [editor] = []
      waitsForPromise ->
        atom.workspace.open('file.tex').then (ed) -> editor = ed

      runs ->
        editor.moveToBottom()
        editor.insertNewline()
        latex.build()

      waitsFor ->
        latex.showResult.callCount == 1

      runs ->
        expect(editor.isModified()).toEqual(false)

    it "supports paths containing spaces", ->
      waitsForPromise ->
        atom.workspace.open('filename with spaces.tex')

      runs ->
        latex.build()

      waitsFor ->
        latex.showResult.callCount == 1

      runs ->
        expect(latex.showResult).toHaveBeenCalled()

    it "invokes `showResult` after a successful build, with expected log parsing result", ->
      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        latex.build()

      waitsFor ->
        latex.showResult.callCount == 1

      runs ->
        expect(latex.showResult).toHaveBeenCalledWith {
          outputFilePath: path.join(fixturesPath, 'file.pdf')
          errors: []
          warnings: []
        }

  describe "getOpener", ->
    originalPlatform = process.platform

    afterEach ->
      helpers.overridePlatform(originalPlatform)

    it "supports OS X", ->
      helpers.overridePlatform('darwin')
      opener = latex.getOpener()

      expect(opener.constructor.name).toEqual('PreviewOpener')

    it "does not support GNU/Linux", ->
      helpers.overridePlatform('linux')
      opener = latex.getOpener()

      expect(opener).toBeUndefined()

    it "does not support Windows", ->
      helpers.overridePlatform('win32')
      opener = latex.getOpener()

      expect(opener).toBeUndefined()

    it "does not support unknown operating system", ->
      helpers.overridePlatform('foo')
      opener = latex.getOpener()

      expect(opener).toBeUndefined()

    it "returns SkimOpener when installed on OS X", ->
      atom.config.set('latex.skimPath', '/Applications/Skim.app')
      helpers.overridePlatform('darwin')

      existsSync = fs.existsSync
      spyOn(fs, 'existsSync').andCallFake (filePath) ->
        return true if filePath is '/Applications/Skim.app'
        existsSync(filePath)

      opener = latex.getOpener()

      expect(opener.constructor.name).toEqual('SkimOpener')
