fs = require "fs-plus"
path = require "path"
temp = require "temp"
wrench = require "wrench"

LogParser = require "../../lib/parsers/log-parser"

describe "LogParser", ->
  [fixturesDir] = []

  beforeEach ->
    fixturesDir = atom.project.getPath()

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
