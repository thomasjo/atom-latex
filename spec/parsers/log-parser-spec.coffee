fs = require "fs-plus"
path = require "path"
temp = require "temp"
wrench = require "wrench"

LogParser = require "../../lib/parsers/log-parser"

describe "LogParser", ->
  [fixturesDir] = []

  beforeEach ->
    fixturesDir = atom.project.getPath()

  describe "parse", ->
    it "returns the expected output path", ->
      expectedFilePath = "/Users/thomasjo/Projects/atom-latex/spec/fixtures/output/file.pdf"
      logFile = path.join(fixturesDir, "file.log")
      parser = new LogParser(logFile)
      result = parser.parse()
      expect(result.outputFilePath).toEqual(expectedFilePath)

  describe "getLines", ->
    it "returns the expected number of lines", ->
      logFile = path.join(fixturesDir, "file.log")
      parser = new LogParser(logFile)
      lines = parser.getLines()
      expect(lines?.length).toEqual 64

    it "throws an error when passed a filepath that doesn't exist", ->
      logFile = path.join(fixturesDir, "nope.log")
      parser = new LogParser(logFile)
      expect(parser.getLines).toThrow();
