helpers = require '../spec-helpers'
LatexmkBuilder = require '../../lib/builders/latexmk'

describe "LatexmkBuilder", ->
  [builder] = []

  beforeEach ->
    builder = new LatexmkBuilder()

  describe "constructArgs", ->
    beforeEach ->
      @filePath = 'foo.tex'

    it "produces default arguments when package has default config values", ->
      expectedArgs = [
        '-interaction=nonstopmode'
        '-f'
        '-cd'
        '-pdf'
        '-synctex=1'
        '-file-line-error'
        "\"#{@filePath}\""
      ]
      args = builder.constructArgs(@filePath)
      expect(args).toEqual(expectedArgs)

    it "adds -shell-escape flag when package config value is set", ->
      helpers.spyOnConfig('latex.enableShellEscape', true)
      expect(builder.constructArgs(@filePath)).toContain "-shell-escape"

    it "adds -outdir=<path> argument according to package config", ->
      outdir = 'bar'
      expectedArg = "-outdir=\"#{outdir}\""
      helpers.spyOnConfig('latex.outputDirectory', outdir)
      expect(builder.constructArgs(@filePath)).toContain expectedArg

    it "adds engine argument according to package config", ->
      helpers.spyOnConfig('latex.engine', 'lualatex')
      expect(builder.constructArgs(@filePath)).toContain "-lualatex"

    it "adds a custom engine string according to package config", ->
      helpers.spyOnConfig('latex.customEngine', 'pdflatex %O %S')
      expect(builder.constructArgs(@filePath)).toContain '-pdflatex="pdflatex %O %S"'
