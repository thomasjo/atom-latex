_ = require "underscore-plus"

module.exports =
class Builder
  constructor: ->
    @envPathKey = switch process.env.platform
      when "win32" then "Path"
      else "PATH"

  run: -> null
  constructArgs: -> null
  parseLogFile: (texFilePath) -> null

  constructChildProcessOptions: ->
    env = _.clone(process.env)
    path = @constructPath()
    env[@envPathKey] = path if path?.length
    options = env: env

  constructPath: ->
    texPath = atom.config.get("latex.texPath")
    texPath?.replace("$PATH", process.env[@envPathKey])
