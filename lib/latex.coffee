path = require "path"
latexmk = require "./latexmk"

module.exports =
  configDefaults:
    texPath: "$PATH:/usr/texbin"
    outputDirectory: ""
    enableShellEscape: false

  activate: ->
    atom.workspaceView.command "latex:build", => @build()

  build: ->
    editor = atom.workspace.activePaneItem
    file = editor?.buffer.file
    unless file?
      # TODO: Show info message that the file has to be saved once?
      return

    editor.save() if editor.isModified() # NOTE: Should this be configurable?
    args = latexmk.constructArgs(file.path)
    proc = latexmk.run args, (statusCode) =>
      if statusCode == 0
        @showResult()
      else
        @showError("TeXification failed! Check the log file for more info...")

    return

  showResult: ->
    # TODO: Display a more visible success message.
    console.info "Success!" unless atom.inSpecMode()

  showError: (error) ->
    # TODO: Introduce proper error and warning handling.
    console.error error unless atom.inSpecMode()
