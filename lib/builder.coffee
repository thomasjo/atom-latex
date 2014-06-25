module.exports =
class Builder
  run: -> null
  constructArgs: -> null

  constructPath: ->
    texPath = atom.config.get("latex.texPath")
    texPath?.replace("$PATH", process.env.PATH)
