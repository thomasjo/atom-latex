latexmk = require "../lib/latexmk"

describe "latexmk", ->
  describe "run", ->
    xit "...", ->
      return

  describe "constructArgs", ->
    it "produces default arguments when package has default config values", ->
      filePath = "/foo/bar.tex"
      expectedArgs = [
        "-interaction=nonstopmode"
        "-f"
        "-cd"
        "-pdf"
        "-pdflatex=\"pdflatex -synctex=1 -file-line-error %O %S\""
        "\"#{filePath}\""
      ]
      args = latexmk.constructArgs(filePath)
      expect(args).toEqual(expectedArgs)

    it "adds -shell-escape flag when package config value is set", ->
      spyOn(atom.config, "get").andCallFake (key) ->
        return true if key == "latex.enableShellEscape"
        return null

      filePath = "/foo/bar.tex"
      expectedArg = "-pdflatex=\"pdflatex -synctex=1 -file-line-error
        -shell-escape %O %S\""
      arg = latexmk.constructArgs(filePath)?.splice(-2, 1)[0]
      expect(arg).toEqual(expectedArg)

  describe "constructPath", ->
    beforeEach ->
      spyOn(atom.config, "get").andReturn("$PATH:/usr/texbin")

    it "reads `latex.texPath` as configured", ->
      latexmk.constructPath()

      expect(atom.config.get).toHaveBeenCalledWith("latex.texPath")

    it "replaces $PATH with process.env.PATH", ->
      expectedPath = "#{process.env.PATH}:/usr/texbin"
      path = latexmk.constructPath()

      expect(path).toEqual(expectedPath)
