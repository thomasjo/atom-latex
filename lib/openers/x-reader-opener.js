/** @babel */

import EvinceOpener from './evince-opener'

const DBUS_NAMES = {
  applicationObject: '/org/x/reader/Xreader',
  applicationInterface: 'org.x.reader.Application',

  daemonService: 'org.x.reader.Daemon',
  daemonObject: '/org/x/reader/Daemon',
  daemonInterface: 'org.x.reader.Daemon',

  windowInterface: 'org.x.reader.Window'
}

export default class XReaderOpener extends EvinceOpener {
  constructor () {
    super('Xreader', DBUS_NAMES)
  }

  canOpenInBackground () {
    return false
  }
}
