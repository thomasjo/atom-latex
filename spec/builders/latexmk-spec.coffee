helpers = require '../spec-helpers'
fs = require 'fs-plus'
path = require 'path'
LatexmkBuilder = require '../../lib/builders/latexmk'

describe "LatexmkBuilder", ->
  [builder, fixturesPath, filePath, logFilePath] = []

  beforeEach ->
    builder = new LatexmkBuilder()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
    logFilePath = path.join(fixturesPath, 'file.log')

  describe "constructArgs", ->
    it "produces default arguments when package has default config values", ->
      expectedArgs = [
        '-interaction=nonstopmode'
        '-f'
        '-cd'
        '-pdf'
        '-synctex=1'
        '-file-line-error'
        "\"#{filePath}\""
      ]
      args = builder.constructArgs(filePath)

      expect(args).toEqual(expectedArgs)

    it "adds -shell-escape flag when package config value is set", ->
      helpers.spyOnConfig('latex.enableShellEscape', true)
      expect(builder.constructArgs(filePath)).toContain "-shell-escape"

    it "adds -outdir=<path> argument according to package config", ->
      outdir = 'bar'
      expectedArg = "-outdir=\"#{path.join(fixturesPath, outdir)}\""
      helpers.spyOnConfig('latex.outputDirectory', outdir)

      expect(builder.constructArgs(filePath)).toContain expectedArg

    it "adds engine argument according to package config", ->
      helpers.spyOnConfig('latex.engine', 'lualatex')
      expect(builder.constructArgs(filePath)).toContain "-lualatex"

    it "adds a custom engine string according to package config", ->
      helpers.spyOnConfig('latex.customEngine', 'pdflatex %O %S')
      expect(builder.constructArgs(filePath)).toContain '-pdflatex="pdflatex %O %S"'

  describe "parseLogFile", ->
    [logParser] = []

    beforeEach ->
      logParser = jasmine.createSpyObj('MockLogParser', ['parse'])
      spyOn(builder, 'getLogParser').andReturn(logParser)

    it "resolves the associated log file path by invoking @resolveLogFilePath", ->
      spyOn(builder, 'resolveLogFilePath').andReturn('foo.log')
      builder.parseLogFile(filePath)

      expect(builder.resolveLogFilePath).toHaveBeenCalledWith(filePath)

    it "returns undefined if passed a file path that does not exist", ->
      filePath = "/foo/bar/quux.tex"
      result = builder.parseLogFile(filePath)

      expect(result).toBeUndefined()
      expect(logParser.parse).not.toHaveBeenCalled()

    it "attempts to parse the resolved log file", ->
      builder.parseLogFile(filePath)

      expect(builder.getLogParser).toHaveBeenCalledWith(logFilePath)
      expect(logParser.parse).toHaveBeenCalled()
