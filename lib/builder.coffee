_ = require "underscore-plus"

module.exports =
class Builder
  constructor: ->
    @envPathKey = unless process.env.platform == "win32" then "PATH" else "Path"

  run: -> null
  constructArgs: -> null

  constructChildProcessOptions: ->
    env = _.clone(process.env)
    path = @constructPath()
    env[@envPathKey] = path if path?.length
    options = env: env

  constructPath: ->
    texPath = atom.config.get("latex.texPath")
    texPath?.replace("$PATH", process.env[@envPathKey])
