Latex = require '../lib/latex'
{Logger} = require './stubs'

window.latex = new Latex()
latex.initialize()
latex.setLogger(new Logger())
