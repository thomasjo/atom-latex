fs = require "fs"
path = require "path"
MagicParser = require "./parsers/magic-parser"

masterFilePattern = ///
  ^\s*              # Optional whitespace.
  \\documentclass   # Command.
  (\[.*\])?         # Optional command options.
  \{.*\}            # Class name.
  ///

module.exports =
class MasterTexFinder
  # Create a new MasterTexFinder.
  # @param filePath: a file name in the directory to be searched
  constructor: (filePath) ->
    @filePath = filePath
    @fileName = path.basename(filePath)
    @projectPath = path.dirname(filePath)

  # Returns the list of tex files in the project directory
  getTexFilesList: ->
    fs.readdirSync(@projectPath).filter (name) -> name.endsWith(".tex")

  # Returns true iff path is a master file (contains the documentclass declaration)
  isMasterFile: (filePath) ->
    return false unless fs.existsSync(filePath)

    rawFile = fs.readFileSync(filePath, {encoding: "utf-8"})
    masterFilePattern.test(rawFile)

  # Returns an array containing the path to the root file indicated by a magic
  # comment in @filePath.
  # Returns null if no magic comment can be found in @filePath.
  getMagicCommentMasterFile: ->
    magic = new MagicParser(@filePath).parse()
    magic?.root

  # Returns the list of tex files in the directory where @filePath lives that
  # contain a documentclass declaration.
  searchForMasterFile: ->
    files = @getTexFilesList()
    return unless files?
    return @fileName if files.length == 0
    return files[0] if files.length == 1

    # result = []
    # for masterCandidate in files
    #   candidatePath = path.join(@projectPath, masterCandidate)
    #   if @isMasterFile(candidatePath)
    #     result.push(candidatePath)
    result = files.filter (name) => @isMasterFile(path.join(@projectPath, name))
    return result[0] if result.length == 1

    console.warn "Cannot find latex master file" unless atom.inSpecMode()
    @fileName

  # Returns the a latex master file.
  #
  # If no latex master file can be found or if @filePath is an invalid file name returns @filePath
  # If the @filePath is itself a master file, it returns immediately
  # If @filePath contains a magic comment uses that comment to find determine the master file
  # Otherwise it searches the directory where @filePath is contained for files
  # having a "documentclass" declaration.
  getMasterTexPath: ->
    masterPath = @getMagicCommentMasterFile()
    return masterPath if masterPath?
    return @fileName if @isMasterFile(@filePath)

    @searchForMasterFile()
