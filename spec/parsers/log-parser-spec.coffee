path = require "path"
utils = require "../spec-utils"
latex = require "../../lib/latex"
LogParser = require "../../lib/parsers/log-parser"

describe "LogParser", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = atom.project.getPath()

  describe "parse", ->
    it "returns the expected output path", ->
      fixturesPath = utils.cloneFixtures()
      utils.mockStatusBar()
      atom.config.set("latex.outputDirectory", "output")
      editor = atom.workspace.openSync("file.tex")
      expectedFilePath = path.join(fixturesPath, "output", "file.pdf")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()
      waitsFor -> latex.showResult.callCount == 1

      runs ->
        logFile = path.join(fixturesPath, "output", "file.log")
        parser = new LogParser(logFile)
        result = parser.parse()
        expect(result.outputFilePath).toEqual(expectedFilePath)

  describe "getLines", ->
    it "returns the expected number of lines", ->
      logFile = path.join(fixturesPath, "file.log")
      parser = new LogParser(logFile)
      lines = parser.getLines()
      expect(lines?.length).toEqual(64)

    it "throws an error when passed a filepath that doesn't exist", ->
      logFile = path.join(fixturesPath, "nope.log")
      parser = new LogParser(logFile)
      expect(parser.getLines).toThrow()
