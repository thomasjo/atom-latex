module.exports =
class Opener
  open: (filePath, callback) -> undefined
  sync: (filePath, texPath, lineNumber, callback) -> undefined

  shouldOpenInBackground: ->
    atom.config.get('latex.openResultInBackground')
