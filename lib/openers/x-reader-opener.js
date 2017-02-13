/* @flow */

import EvinceOpener from './evince-opener'
import type { DbusNames } from '../types'

const DBUS_NAMES: DbusNames = {
  applicationObject: '/org/x/reader/Xreader',
  applicationInterface: 'org.x.reader.Application',

  daemonService: 'org.x.reader.Daemon',
  daemonObject: '/org/x/reader/Daemon',
  daemonInterface: 'org.x.reader.Daemon',

  windowInterface: 'org.x.reader.Window'
}

export default class XReaderOpener extends EvinceOpener {
  constructor (): void {
    super('Xreader', DBUS_NAMES)
  }

  canOpenInBackground (): boolean {
    return false
  }
}
