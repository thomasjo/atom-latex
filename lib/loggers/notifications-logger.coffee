Logger = require '../logger'

module.exports =
class NotificationsLogger extends Logger
  error: (statusCode, result, builder) ->
    atom.notifications.addError(
      "LaTeX build failed with status code #{statusCode}",
      dismissable: true
      )

  warning: (message) ->
    atom.notifications.addWarning(message, dismissable: true)

  info: (message) ->
    atom.notifications.addInfo(message)
