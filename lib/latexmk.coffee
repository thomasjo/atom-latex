child_process = require "child_process"

module.exports =
  run: (path, args) ->
    proc = child_process.spawn(path, args)

    proc.on 'close', (code, signal) ->
      if code == 0
        # TODO: Display a more visible success message.
        console.info "Success!"
      else
        # TODO: Introduce proper error and warning handling.
        console.error "TeXification failed! Check the log file for more info..."
