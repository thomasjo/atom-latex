runas = require "runas"

module.exports =
  run: (path, args) ->
    exitCode = runas(path, args)

    if exitCode == 0
      # TODO: Display a more visible success message.
      console.info "Success!"
    else
      # TODO: Introduce proper error and warning handling.
      console.error "TeXification failed! Check the log file for more info..."

    exitCode
