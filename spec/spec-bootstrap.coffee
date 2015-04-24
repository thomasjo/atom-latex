Latex = require '../lib/latex'
{NullLogger} = require './stubs'

global.latex = new Latex()
latex.setLogger(new NullLogger())
