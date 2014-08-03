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
    console.debug options
    options

  constructPath: ->
    texPath = atom.config.get("latex.texPath")
    console.debug texPath?.replace("$PATH", process.env[@envPathKey])
    # console.debug process.env[@envPathKey]
    texPath?.replace("$PATH", process.env[@envPathKey]) if texPath?
