helpers = require './spec-helpers'
fs = require 'fs-plus'
path = require 'path'
Composer = require '../lib/composer'

fdescribe "Composer", ->
  [fixturesPath, composer, mockBuilder, statusCode] = []

  beforeEach ->
    fixturesPath = helpers.cloneFixtures()
    composer = new Composer()

    mockBuilder = jasmine.createSpyObj('MockBuilder', ['constructArgs', 'run', 'parseLogFile'])
    mockBuilder.constructArgs.andReturn([])

    statusCode = 0
    mockBuilder.run.andCallFake (args, callback) -> callback(statusCode)

  describe "build", ->
    [originalTimeoutInterval] = []

    beforeEach ->
      originalTimeoutInterval = helpers.setTimeoutInterval(10000)

      spyOn(composer, 'showResult').andReturn()
      spyOn(composer, 'showError').andReturn()

    afterEach ->
      helpers.setTimeoutInterval(originalTimeoutInterval)

    it "does nothing for new, unsaved files", ->
      spyOn(composer, 'build').andCallThrough()

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
      spyOn(latex, 'getBuilder').andReturn(mockBuilder)
      mockBuilder.parseLogFile.andReturn
        outputFilePath: null
        errors: []
        warnings: []

      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        composer.build()

      waitsFor ->
        composer.showError.callCount is 1

      runs ->
        expect(composer.showError).toHaveBeenCalled()

    it "treats missing result from parser as an error", ->
      spyOn(latex, 'getBuilder').andReturn(mockBuilder)

      mockBuilder.parseLogFile.andReturn(null)

      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        composer.build()

      waitsFor ->
        composer.showError.callCount is 1

      runs ->
        expect(composer.showError).toHaveBeenCalled()
