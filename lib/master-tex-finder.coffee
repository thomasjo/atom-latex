fs = require 'fs'
path = require 'path'

# MasterTexFinder is a utility class returning the master tex file
# in a latex project. The algorithm always returns a result unless
# the directory does not include any tex file. The result is guaranteed
# to be the latex master file if the project is correctly structured (i.e.,
# inclusion graph is a tree).

module.exports =
class MasterTexFinder

  # Create a new MasterTexFinder.
  # @param filePath: a file name in the directory to be searched
  constructor: (filePath) ->
    @filePath = filePath
    @projPath = path.dirname(@filePath)

  # Returns the list of tex files in the project directory
  texFilesList: ->
    fs.readdirSync(@projPath).filter (fname) ->
      fname.match /\.tex$/

  # Returns true iff fname is a master file (contains the documentclass declaration)
  isMasterFile: (fname) ->
    fs.readFileSync(fname).toString().match( /^\s*\\documentclass(\[.*\])?\{.*\}/ ) != null

  # Returns the latex master file for the current directory.
  masterTexPath: ->
    return @filePath if @filePath != null && @isMasterFile(@filePath)

    files = @texFilesList()
    return null if files.length == 0
    return files[0] if files.length == 1

    for masterCandidate in files
      if @isMasterFile path.join(@projPath, masterCandidate)
        return path.join(@projPath, masterCandidate)

    return null
