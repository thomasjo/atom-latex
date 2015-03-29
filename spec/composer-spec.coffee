helpers = require './spec-helpers'
fs = require 'fs-plus'
path = require 'path'
Composer = require '../lib/composer'

describe "Composer", ->
  [composer] = []

  beforeEach ->
    composer = new Composer()

  describe "build", ->
    [editor, builder] = []

    initializeSpies = ({filePath, statusCode}) ->
      statusCode ?= 0

      editor = jasmine.createSpyObj('MockEditor', ['save', 'isModified'])
      spyOn(composer, 'resolveRootFilePath').andReturn(filePath)
      spyOn(composer, 'getEditorDetails').andReturn
        editor: editor
        filePath: filePath

      builder = jasmine.createSpyObj('MockBuilder', ['run', 'constructArgs', 'parseLogFile'])
      builder.run.andCallFake (args) ->
        switch statusCode
          when 0 then Promise.resolve(statusCode)
          else Promise.reject(statusCode)
      spyOn(latex, 'getBuilder').andReturn(builder)

    beforeEach ->
      spyOn(composer, 'showResult').andReturn()
      spyOn(composer, 'showError').andReturn()

    it "does nothing for new, unsaved files", ->
      initializeSpies({filePath: null})

      result = undefined
      waitsForPromise ->
        composer.build().catch (r) -> result = r

      runs ->
        expect(result).toBe false
        expect(composer.showResult).not.toHaveBeenCalled()
        expect(composer.showError).not.toHaveBeenCalled()

    it "does nothing for unsupported file extensions", ->
      initializeSpies({filePath: 'foo.bar'})

      result = undefined
      waitsForPromise ->
        composer.build().catch (r) -> result = r

      runs ->
        expect(result).toBe false
        expect(composer.showResult).not.toHaveBeenCalled()
        expect(composer.showError).not.toHaveBeenCalled()

    it "saves the file before building, if modified", ->
      initializeSpies({filePath: 'file.tex'})
      editor.isModified.andReturn(true)

      builder.parseLogFile.andReturn result =
        outputFilePath: 'file.pdf'
        errors: []
        warnings: []

      waitsForPromise ->
        composer.build()

      runs ->
        expect(editor.isModified).toHaveBeenCalled()
        expect(editor.save).toHaveBeenCalled()

    it "invokes `showResult` after a successful build, with expected log parsing result", ->
      initializeSpies({filePath: 'file.tex'})

      builder.parseLogFile.andReturn result =
        outputFilePath: 'file.pdf'
        errors: []
        warnings: []

      waitsForPromise ->
        composer.build()

      runs ->
        expect(composer.showResult).toHaveBeenCalledWith(result)

    it "treats missing output file data in log file as an error", ->
      initializeSpies({filePath: 'file.tex'})

      builder.parseLogFile.andReturn
        outputFilePath: null
        errors: []
        warnings: []

      waitsForPromise shouldReject: true, ->
        composer.build()

      runs ->
        expect(composer.showError).toHaveBeenCalled()

    it "treats missing result from parser as an error", ->
      initializeSpies({filePath: 'file.tex'})

      builder.parseLogFile.andReturn(null)

      waitsForPromise shouldReject: true, ->
        composer.build()

      runs ->
        expect(composer.showError).toHaveBeenCalled()
