Latex = require '../lib/latex'
{NullLogger} = require './stubs'

window.latex = new Latex()
latex.setLogger(new NullLogger())
