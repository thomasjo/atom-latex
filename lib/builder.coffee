path = require "path"

module.exports =
class Builder
  run: -> null
  constructArgs: -> null

  constructPath: ->
    texPath = atom.config.get("latex.texPath")
    texPath += path.delimiter if texPath
    texPath += process.env.PATH
