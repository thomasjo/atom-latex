Logger = require '../logger'

module.exports =
class NotificationsLogger extends Logger
  error: (statusCode, result, builder) ->
    [message, detail] = []
    switch statusCode
      when 127
        executable = 'latexmk' # TODO: Read from Builder::executable in the future.
        message = "TeXification failed! Builder executable '#{executable}' not found."
        detail =
          """
          latex.texPath
            as configured: #{atom.config.get('latex.texPath')}
            when resolved: #{builder.constructPath()}

          Make sure latex.texPath is configured correctly; either adjust it \
          via the settings view, or directly in your config.cson file.
          """
      else
        message = "TeXification failed with status code #{statusCode}"
        if result?.errors?
          lines = []
          for error in result.errors
            lines.push("#{error.filePath}:#{error.lineNumber}: #{error.message}")
          detail = lines.join('\n')

    atom.notifications.addError(message, {dismissable: true, detail: detail})

  warning: (message) ->
    atom.notifications.addWarning(message, dismissable: true)

  info: (message) ->
    atom.notifications.addInfo(message)
