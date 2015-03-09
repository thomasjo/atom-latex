module.exports =
class Latex
  initialize: ->
    @setDefaultLogger()
    @createLogProxy()
    @setDefaultBuilder()
    @setDefaultOpener()

  getBuilder: -> @builder
  getLogger: -> @logger
  getOpener: -> @opener

  setLogger: (logger) -> @logger = logger

  setDefaultBuilder: ->
    LatexmkBuilder = require './builders/latexmk'
    @builder = new LatexmkBuilder()

  setDefaultLogger: ->
    ConsoleLogger = require './loggers/console-logger'
    @logger = new ConsoleLogger()

  setDefaultOpener: ->
    if OpenerImpl = @resolveOpenerImplementation(process.platform)
      @opener = new OpenerImpl()
    else if @logger? and @log?
      @log.warning """
        No PDF opener found.
        For cross-platform viewing, consider install the pdf-view package.
        """

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
