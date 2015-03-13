helpers = require './spec-helpers'
path = require 'path'
Builder = require '../lib/builder'

fdescribe "Builder", ->
  [builder] = []

  beforeEach ->
    builder = new Builder()

  describe "constructPath", ->
    it "reads `latex.texPath` as configured", ->
      spyOn(atom.config, 'get').andReturn()
      builder.constructPath()

      expect(atom.config.get).toHaveBeenCalledWith('latex.texPath')

    it "uses platform default when `latex.texPath` is not configured", ->
      helpers.spyOnConfig('latex.texPath', '')
      spyOn(builder, 'defaultTexPath').andReturn(defaultTexPath = '/foo/bar')
      expectedPath = [defaultTexPath, process.env.PATH].join(path.delimiter)
      constructedPath = builder.constructPath()

      expect(constructedPath).toEqual(expectedPath)

    it "replaces surrounded $PATH with process.env.PATH", ->
      helpers.spyOnConfig('latex.texPath', texPath = '/foo:$PATH:/bar')
      expectedPath = texPath.replace('$PATH', process.env.PATH)
      constructedPath = builder.constructPath()

      expect(constructedPath).toEqual(expectedPath)

    it "replaces leading $PATH with process.env.PATH", ->
      helpers.spyOnConfig('latex.texPath', texPath = '$PATH:/bar')
      expectedPath = texPath.replace('$PATH', process.env.PATH)
      constructedPath = builder.constructPath()

      expect(constructedPath).toEqual(expectedPath)

    it "replaces trailing $PATH with process.env.PATH", ->
      helpers.spyOnConfig('latex.texPath', texPath = '/foo:$PATH')
      expectedPath = texPath.replace('$PATH', process.env.PATH)
      constructedPath = builder.constructPath()

      expect(constructedPath).toEqual(expectedPath)

    it "prepends process.env.PATH with texPath", ->
      helpers.spyOnConfig('latex.texPath', texPath = '/foo')
      expectedPath = [texPath, process.env.PATH].join(path.delimiter)
      constructedPath = builder.constructPath()

      expect(constructedPath).toEqual(expectedPath)
