helpers = require "./spec-helpers"
path = require "path"
latex = require "../lib/latex"

describe "Latex", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = helpers.cloneFixtures()
    helpers.mockStatusBar()

  describe "build", ->
    beforeEach ->
      spyOn(latex, "getOpener").andReturn()

    it "does nothing for new, unsaved files", ->
      editor = atom.workspace.openSync()

      spyOn(latex, "build").andCallThrough()
      spyOn(latex, "showResult").andCallThrough()
      spyOn(latex, "showError").andCallThrough()
      latex.build()

      waitsFor -> latex.build.callCount == 1
      runs ->
        expect(latex.showResult).not.toHaveBeenCalled()
        expect(latex.showError).not.toHaveBeenCalled()

    it "runs `latexmk` for existing files", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalled()

    it "saves the file before building, if modified", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      editor.moveCursorToBottom()
      editor.insertNewline()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(editor.isModified()).toEqual(false)

    it "supports paths containing spaces", ->
      editor = atom.workspace.openSync("filename with spaces.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalled()

    it "invokes `showResult` after a successful build, with expected log parsing result", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalledWith {
        outputFilePath: path.join(fixturesPath, "file.pdf")
        errors: []
        warnings: []
      }

  describe "getOpener", ->
    originalPlatform = process.platform

    afterEach ->
      helpers.overridePlatform(originalPlatform)

    it "supports OS X", ->
      ExpectedOpener = require "../lib/pdf-openers/preview-app-pdf-opener"

      helpers.overridePlatform("darwin")
      opener = latex.getOpener()

      expect(opener).toEqual(new ExpectedOpener)
