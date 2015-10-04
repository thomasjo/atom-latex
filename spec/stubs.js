'use babel'

import Logger from '../lib/logger'
import Opener from '../lib/opener'

export class NullLogger extends Logger {
  error () {}
  warning () {}
  info () {}
}

export class NullOpener extends Opener {
  open () {}
}
