/* @flow */

import EvinceOpener from './evince-opener'
import type { DbusNames } from '../types'

const DBUS_NAMES: DbusNames = {
  applicationObject: '/org/mate/atril/Atril',
  applicationInterface: 'org.mate.atril.Application',

  daemonService: 'org.mate.atril.Daemon',
  daemonObject: '/org/mate/atril/Daemon',
  daemonInterface: 'org.mate.atril.Daemon',

  windowInterface: 'org.mate.atril.Window'
}

export default class AtrilOpener extends EvinceOpener {
  constructor (): void {
    super('Atril', DBUS_NAMES)
  }

  canOpenInBackground (): boolean {
    return false
  }
}
