{View} = require "atom"

module.exports =
class ErrorIndicatorView extends View
  @content: ->
    @div class: "latex-error-indicator inline-block", =>
      @span "Latex Compilation Error"

  destroy: ->
    @remove()
