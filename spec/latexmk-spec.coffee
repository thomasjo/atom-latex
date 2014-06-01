latexmk = require "../lib/latexmk"

spyOnConfig = (key, value) =>
  spyOn(atom.config, "get").andCallFake (_key) =>
    return value if _key == key
    return null

describe "latexmk", ->
  describe "run", ->
    xit "...", ->
      return

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
      args = latexmk.constructArgs(@filePath)
      expect(args).toEqual(expectedArgs)

    it "adds -shell-escape flag when package config value is set", ->
      expectedArg = "-pdflatex=\"pdflatex -synctex=1 -file-line-error
        -shell-escape %O %S\""
      spyOnConfig("latex.enableShellEscape", true)
      arg = latexmk.constructArgs(@filePath)?.splice(-2, 1)[0]
      expect(arg).toEqual(expectedArg)

  describe "constructPath", ->
    beforeEach ->
      spyOnConfig("latex.texPath", "$PATH:/usr/texbin")

    it "reads `latex.texPath` as configured", ->
      latexmk.constructPath()
      expect(atom.config.get).toHaveBeenCalledWith("latex.texPath")

    it "replaces $PATH with process.env.PATH", ->
      expectedPath = "#{process.env.PATH}:/usr/texbin"
      path = latexmk.constructPath()
      expect(path).toEqual(expectedPath)
