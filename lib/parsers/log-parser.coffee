fs = require "fs-plus"
path = require "path"

module.exports =
class LogParser
  constructor: (filePath) ->
    @filePath = filePath

  parse: ->
    lines = @getLines()

  getLines: ->
    unless fs.existsSync(@filePath)
      throw new Error("No such file: #{@filePath}")

    rawFile = fs.readFileSync(@filePath, {encoding: "utf-8"})
    lines = rawFile.replace(/(\r\n)|\r/g, "\n").split("\n")
