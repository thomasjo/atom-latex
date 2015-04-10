module.exports =
class Latex
  initialize: ->
    @createLogProxy()

    Object.defineProperty this, 'builder',
      get: -> @__builder ?= @setDefaultBuilder()
      set: (builder) -> @__builder = builder

    Object.defineProperty this, 'logger',
      get: -> @__logger ?= @setDefaultLogger()
      set: (logger) -> @__logger = logger

    Object.defineProperty this, 'opener',
      get: -> @__opener ?= @setDefaultOpener()
      set: (opener) -> @__opener = opener

  getBuilder: -> @builder
  getLogger: -> @logger
  getOpener: -> @opener

  setLogger: (logger) -> @logger = logger

  setDefaultBuilder: ->
    LatexmkBuilder = require './builders/latexmk'
    @__builder = new LatexmkBuilder()

  setDefaultLogger: ->
    ConsoleLogger = require './loggers/console-logger'
    @__logger = new ConsoleLogger()

  setDefaultOpener: ->
    if OpenerImpl = @resolveOpenerImplementation(process.platform)
      @__opener = new OpenerImpl()
    else if @__logger? and @log?
      @log.warning '''
        No PDF opener found.
        For cross-platform viewing, consider installing the pdf-view package.
        '''

  createLogProxy: ->
    @log =
      error: (statusCode, result, builder) => @logger.error(statusCode, result, builder)
      warning: (message) => @logger.warning(message)
      info: (message) => @logger.info(message)

  resolveOpenerImplementation: (platform) ->
    OpenerImpl = switch platform
      when 'darwin'
        if fs.existsSync(atom.config.get('latex.skimPath'))
          require './openers/skim-opener'
        else
          require './openers/preview-opener'
      when 'win32'
        if fs.existsSync(atom.config.get('latex.sumatraPath'))
          require './openers/sumatra-opener'

    unless OpenerImpl?
      if atom.packages.resolvePackagePath('pdf-view')?
        OpenerImpl = require './openers/atompdf-opener'

    OpenerImpl
