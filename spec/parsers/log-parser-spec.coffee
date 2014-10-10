helpers = require '../spec-helpers'
path = require 'path'
latex = require '../../lib/latex'
LogParser = require '../../lib/parsers/log-parser'

describe "LogParser", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = atom.project.getPaths()[0]
    helpers.mockStatusBar()

  describe "parse", ->
    it "returns the expected output path", ->
      oldTimeoutInterval = helpers.setTimeoutInterval(10000)
      fixturesPath = helpers.cloneFixtures()
      expectedFilePath = path.join(fixturesPath, 'output', 'file.pdf')
      atom.config.set('latex.outputDirectory', 'output')

      spyOn(latex, 'showResult').andCallThrough()
      spyOn(latex, 'getOpener').andReturn()

      waitsForPromise ->
        atom.workspace.open('file.tex')

      runs ->
        latex.build()

      waitsFor ->
        latex.showResult.callCount == 1

      runs ->
        helpers.setTimeoutInterval(oldTimeoutInterval)

        logFile = path.join(fixturesPath, 'output', 'file.log')
        parser = new LogParser(logFile)
        result = parser.parse()

        expect(result.outputFilePath).toEqual(expectedFilePath)

  describe "getLines", ->
    it "returns the expected number of lines", ->
      logFile = path.join(fixturesPath, 'file.log')
      parser = new LogParser(logFile)
      lines = parser.getLines()

      expect(lines?.length).toEqual(64)

    it "throws an error when passed a filepath that doesn't exist", ->
      logFile = path.join(fixturesPath, 'nope.log')
      parser = new LogParser(logFile)

      expect(parser.getLines).toThrow()
