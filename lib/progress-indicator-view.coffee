{View} = require 'atom'

module.exports =
class ProgressIndicatorView extends View
  @content: ->
    @div class: 'latex-progress-indicator inline-block', =>
      @span 'Compiling TeX file'
      @span class: 'dot one', '.'
      @span class: 'dot two', '.'
      @span class: 'dot three', '.'

  destroy: ->
    @remove()
