'use babel'

import Latex from '../lib/latex'
import {NullLogger} from './stubs'

global.latex = new Latex()
latex.setLogger(new NullLogger())
