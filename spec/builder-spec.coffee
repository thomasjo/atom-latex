helpers = require "./spec-helpers"
Builder = require "../lib/builder"

describe "Builder", ->
  [builder] = []

  beforeEach ->
    builder = new Builder

  describe "constructPath", ->
    beforeEach ->
      helpers.spyOnConfig("latex.texPath", "$PATH:/usr/texbin")

    it "reads `latex.texPath` as configured", ->
      builder.constructPath()
      expect(atom.config.get).toHaveBeenCalledWith("latex.texPath")

    it "replaces $PATH with process.env.PATH", ->
      expectedPath = "#{process.env.PATH}:/usr/texbin"
      constructedPath = builder.constructPath()
      expect(constructedPath).toEqual(expectedPath)
