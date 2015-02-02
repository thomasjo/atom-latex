{View} = require 'space-pen'

module.exports =
class ErrorIndicatorView extends View
  @content: ->
    @div class: 'latex-error-indicator inline-block', =>
      @span 'LaTeX compilation error'

  destroy: ->
    @remove()
