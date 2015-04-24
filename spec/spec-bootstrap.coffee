Latex = require '../lib/latex'
{Logger} = require './stubs'

window.latex = new Latex()
latex.setLogger(new Logger())
