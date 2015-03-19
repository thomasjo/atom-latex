helpers = require '../spec-helpers'
path = require 'path'
Composer = require '../../lib/composer'
LogParser = require '../../lib/parsers/log-parser'

describe "LogParser", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = atom.project.getPaths()[0]

  describe "parse", ->
    it "returns the expected output path", ->
      logFile = path.join(fixturesPath, 'file.log')
      parser = new LogParser(logFile)
      result = parser.parse()
      outputFilePath = path.posix.resolve(result.outputFilePath)

      expect(outputFilePath).toBe '/foo/output/file.pdf'

    it "parses and returns all errors", ->
      logFile = path.join(fixturesPath, 'errors.log')
      parser = new LogParser(logFile)
      result = parser.parse()

      expect(result.errors.length).toEqual(3)

    it "associates an error with a file path, line number, and message", ->
      logFile = path.join(fixturesPath, 'errors.log')
      parser = new LogParser(logFile)
      result = parser.parse()
      error = result.errors[0]

      expect(error).toEqual {
        filePath: './errors.tex'
        lineNumber: 10
        message: '\\begin{gather*} on input line 8 ended by \\end{gather}'
      }

  describe "getLines", ->
    it "returns the expected number of lines", ->
      logFile = path.join(fixturesPath, 'file.log')
      parser = new LogParser(logFile)
      lines = parser.getLines()

      expect(lines.length).toEqual(63)

    it "throws an error when passed a filepath that doesn't exist", ->
      logFile = path.join(fixturesPath, 'nope.log')
      parser = new LogParser(logFile)

      expect(parser.getLines).toThrow()
