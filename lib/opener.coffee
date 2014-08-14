module.exports =
class Opener
  open: (filePath, callback) -> undefined

  shouldOpenInBackground: ->
    atom.config.get('latex.openResultInBackground')
