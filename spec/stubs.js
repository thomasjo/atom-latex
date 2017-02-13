/* @flow */

import Builder from '../lib/builder'
import Logger from '../lib/logger'
import Opener from '../lib/opener'

export class NullBuilder extends Builder {
  extension = '.tex'
  canProcess (filePath: string): boolean { return filePath.endsWith(this.extension) }
}

export class NullLogger extends Logger {
  error () {}
  warning () {}
  info () {}
}

export class NullOpener extends Opener {
  async open () {}
}
