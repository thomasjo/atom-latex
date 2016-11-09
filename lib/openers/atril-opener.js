/** @babel */

import EvinceOpener from './evince-opener'

const DBUS_NAMES = {
  applicationObject: '/org/mate/atril/Atril',
  applicationInterface: 'org.mate.atril.Application',

  daemonService: 'org.mate.atril.Daemon',
  daemonObject: '/org/mate/atril/Daemon',
  daemonInterface: 'org.mate.atril.Daemon',

  windowInterface: 'org.mate.atril.Window'
}

export default class AtrilOpener extends EvinceOpener {
  constructor () {
    super('Atril', DBUS_NAMES)
  }

  canOpenInBackground () {
    return false
  }
}
