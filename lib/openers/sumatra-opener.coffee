child_process = require 'child_process'
Opener = require '../opener'

module.exports =
class SumatraOpener extends Opener
  open: (filePath, texPath, lineNumber, callback) ->
    sumatraPath = atom.config.get('latex.sumatraPath')
    args = [
      '-forward-search'
      texPath
      lineNumber
      filePath
    ]
    child_process.execFile(sumatraPath, args)
