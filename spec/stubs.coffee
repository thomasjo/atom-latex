Logger = require '../lib/logger'
Opener = require '../lib/opener'

class NullLogger extends Logger
  error: -> null
  warning: -> null
  info: -> null


class NullOpener extends Opener
  open: (filePath, texPath, lineNumber, callback) -> null


module.exports =
  Logger: NullLogger
  Opener: NullOpener
