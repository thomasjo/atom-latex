path = require "path"
utils = require "./spec-utils"
latex = require "../lib/latex"

describe "Latex", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = utils.cloneFixtures()
    utils.mockStatusBar()

  describe "build", ->
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

    it "invokes `showResult` after a successful build, with expect log parsing result", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalledWith {
        outputFilePath: path.join(fixturesPath, "file.pdf")
        errors: []
        warnings: []
      }
