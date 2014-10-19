module.exports =
class Opener
  open: (filePath, texPath, lineNumber, callback) -> undefined

  shouldOpenInBackground: ->
    atom.config.get('latex.openResultInBackground')
