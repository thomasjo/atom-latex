helpers = require './spec-helpers'
Latex = require '../lib/latex'

describe "Latex", ->
  [latex] = []

  beforeEach ->
    latex = new Latex()

  describe "initialize", ->
    it "initializes all properties", ->
      latex.initialize()

      expect(latex.builder).toBeDefined()
      expect(latex.logger).toBeDefined()
      expect(latex.opener).toBeDefined()

  describe "setDefaultBuilder", ->
    it "sets the default builder to LatexmkBuilder", ->
      origin = latex.builder
      latex.setDefaultBuilder()

      expect(origin).toBeUndefined()
      expect(latex.builder.constructor.name).toBe 'LatexmkBuilder'

  describe "setDefaultLogger", ->
    it "sets the default logger to ConsoleLogger", ->
      origin = latex.logger
      latex.setDefaultLogger()

      expect(origin).toBeUndefined()
      expect(latex.logger.constructor.name).toBe 'ConsoleLogger'

  describe "setDefaultOpener", ->
    it "sets the default logger as resolved", ->
      origin = latex.opener
      opener = helpers.nullOpener()
      spyOn(latex, 'resolveOpenerImplementation').andReturn(opener.constructor)
      latex.setDefaultOpener()

      expect(origin).toBeUndefined()
      expect(latex.opener.constructor.name).toEqual(opener.constructor.name)

  describe "Logger proxy", ->
    [logger] = []

    beforeEach ->
      logger = jasmine.createSpyObj('MockLogger', ['error', 'warning', 'info'])
      latex.setLogger(logger)
      latex.createLogProxy()

    it "correctly proxies error to error", ->
      statusCode = 0
      result = foo: 'bar'
      builder = run: -> ''
      latex.log.error(statusCode, result, builder)

      expect(logger.error).toHaveBeenCalledWith(statusCode, result, builder)

    it "correctly proxies warning to warning", ->
      message = "foo"
      latex.log.warning(message)

      expect(logger.warning).toHaveBeenCalledWith(message)

    it "correctly proxies info to info", ->
      message = "foo"
      latex.log.info(message)

      expect(logger.info).toHaveBeenCalledWith(message)

  describe "resolveOpenerImplementation", ->
    it "returns SkimOpener when installed, and running on OS X", ->
      atom.config.set('latex.skimPath', '/Applications/Skim.app')

      existsSync = fs.existsSync
      spyOn(fs, 'existsSync').andCallFake (filePath) ->
        return true if filePath is '/Applications/Skim.app'
        existsSync(filePath)

      opener = latex.resolveOpenerImplementation('darwin')

      expect(opener.name).toEqual('SkimOpener')

    it "returns PreviewOpener when Skim is not installed, and running on OS X", ->
      atom.config.set('latex.skimPath', '/foo/Skim.app')
      helpers.overridePlatform('darwin')
      opener = latex.resolveOpenerImplementation('darwin')

      expect(opener.name).toBe 'PreviewOpener'

    it "returns SumatraOpener when installed, and running on Windows", ->
      atom.config.set('latex.sumatraPath', 'c:\\foo.exe')

      existsSync = fs.existsSync
      spyOn(fs, 'existsSync').andCallFake (filePath) ->
        return true if filePath is 'c:\\foo.exe'
        existsSync(filePath)

      opener = latex.resolveOpenerImplementation('win32')

      expect(opener.name).toBe 'SumatraOpener'

    it "returns AtomPdfOpener as a fallback, if the pdf-view package is installed", ->
      resolvePackagePath = atom.packages.resolvePackagePath
      spyOn(atom.packages, 'resolvePackagePath') unless jasmine.isSpy(resolvePackagePath)
      atom.packages.resolvePackagePath.andCallFake (name) ->
        return true if name is 'pdf-view'
        resolvePackagePath(name)

      opener = latex.resolveOpenerImplementation('foo')

      expect(opener.name).toBe 'AtomPdfOpener'

    it "does not support GNU/Linux", ->
      opener = latex.resolveOpenerImplementation('linux')

      expect(opener).toBeUndefined()

    it "does not support unknown operating systems", ->
      opener = latex.resolveOpenerImplementation('foo')

      expect(opener).toBeUndefined()
