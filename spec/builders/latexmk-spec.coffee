helpers = require "../spec-helpers"
LatexmkBuilder = require "../../lib/builders/latexmk"

describe "LatexmkBuilder", ->
  [builder] = []

  beforeEach ->
    builder = new LatexmkBuilder

  describe "constructArgs", ->
    beforeEach ->
      @filePath = "foo.tex"

    it "produces default arguments when package has default config values", ->
      expectedArgs = [
        "-interaction=nonstopmode"
        "-f"
        "-cd"
        "-pdf"
        "-pdflatex=\"pdflatex -synctex=1 -file-line-error %O %S\""
        "\"#{@filePath}\""
      ]
      args = builder.constructArgs(@filePath)
      expect(args).toEqual(expectedArgs)

    it "adds -shell-escape flag when package config value is set", ->
      expectedArg = "-pdflatex=\"pdflatex -synctex=1 -file-line-error
        -shell-escape %O %S\""
      helpers.spyOnConfig("latex.enableShellEscape", true)
      arg = builder.constructArgs(@filePath)?.splice(-2, 1)[0]
      expect(arg).toEqual(expectedArg)

    it "adds -outdir=<path> argument according to package config", ->
      outdir = "bar"
      expectedArg = "-outdir=\"#{outdir}\""
      helpers.spyOnConfig("latex.outputDirectory", outdir)
      arg = builder.constructArgs(@filePath)?.splice(-2, 1)[0]
      expect(arg).toEqual(expectedArg)
