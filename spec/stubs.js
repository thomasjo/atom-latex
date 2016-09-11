/** @babel */

import Builder from '../lib/builder'
import Logger from '../lib/logger'
import Opener from '../lib/opener'

export class NullBuilder extends Builder {
  run () { return new Promise(resolve => resolve(0)) }

  static canProcess (filePath) { return true }
}

export class NullLogger extends Logger {
  error () {}
  warning () {}
  info () {}
}

export class NullOpener extends Opener {
  open () {}
}
