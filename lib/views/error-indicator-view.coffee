{View} = require 'space-pen'

module.exports =
class ErrorIndicatorView extends View
  @content: ->
    @div class: 'latex-error-indicator inline-block', =>
      @a click: 'openDevConsole', 'LaTeX compilation error'

  destroy: ->
    @remove()

  openDevConsole: ->
    atom.openDevTools()
    atom.executeJavaScriptInDevTools('InspectorFrontendAPI.showConsole()')
