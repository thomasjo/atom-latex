latexmk = require "../lib/latexmk"

describe "latexmk", ->
  describe "run", ->
    xit "...", ->
      return

  describe "constructArgs", ->
    xit "...", ->
      return

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
