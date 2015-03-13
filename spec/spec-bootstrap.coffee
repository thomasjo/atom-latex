Latex = require '../lib/latex'
Logger = require '../lib/logger'

class NullLogger extends Logger
  error: -> null
  warning: -> null
  info: -> null

window.latex = new Latex()
latex.initialize()
latex.setLogger(new NullLogger())
