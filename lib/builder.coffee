_ = require "underscore-plus"
path = require "path"

module.exports =
class Builder
  constructor: ->
    @envPathKey = switch process.platform
      when "win32" then "Path"
      else "PATH"

  run: (args, callback) ->
  constructArgs: (filePath) ->
  parseLogFile: (texFilePath) ->

  constructChildProcessOptions: ->
    env = _.clone(process.env)
    env[@envPathKey] = childPath if childPath = @constructPath()
    options = env: env

  constructPath: ->
    texPath = atom.config.get("latex.texPath")?.trim()
    texPath = @defaultTexPath() unless texPath?.length
    texPath = texPath.replace("$PATH", process.env[@envPathKey])

  defaultTexPath: ->
    switch process.platform
      when "win32"
        "$PATH;C:\\texlive\\2014\\bin\\win32"
      else
        "$PATH:/usr/texbin"

  resolveLogFilePath: (texFilePath) ->
    outputDirectory = atom.config.get("latex.outputDirectory") ? ""
    currentDirectory = path.dirname(texFilePath)
    fileName = path.basename(texFilePath).replace(/\.tex$/, ".log")
    logFilePath = path.join(currentDirectory, outputDirectory, fileName)
