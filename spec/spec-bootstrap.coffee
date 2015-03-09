Latex = require '../lib/latex'
Logger = require '../lib/logger'

class NullLogger extends Logger
  error: ->
  warning: ->
  info: ->

window.latex = new Latex()
latex.initialize()
latex.setLogger(new NullLogger())
