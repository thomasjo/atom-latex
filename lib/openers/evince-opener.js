/** @babel */

import Opener from '../opener'
import dbus from 'dbus-native'
import url from 'url'

function SyncSource (uri, point) {
  atom.workspace.open(url.parse(uri).pathname).then(editor => editor.setCursorBufferPosition(point))
}

export default class EvinceOpener extends Opener {
  constructor () {
    super()
    this.bus = dbus.sessionBus()
    this.bus.signals.on('SyncSource', () => console.log(arguments))
    this.daemon = null
    this.windows = {}
  }

  getDaemon (callback) {
    if (this.daemon) return callback(null, this.daemon)
    this.bus.getInterface('org.gnome.evince.Daemon', '/org/gnome/evince/Daemon', 'org.gnome.evince.Daemon',
      (error, daemon) => {
        if (error) return callback(error, null)
        this.daemon = daemon
        callback(daemon)
      })
  }

  getWindow (filePath, texPath, callback) {
    const findDocument = (daemon) => {
      // The daemon seems to require the file protocol
      daemon.FindDocument('file://' + filePath, true, (error, name) => {
        if (error) return callback(error)
        getApplication(name)
      })
    }

    const getApplication = (name) => {
      this.bus.getInterface(name, '/org/gnome/evince/Evince', 'org.gnome.evince.Application', (error, application) => {
        if (error) return callback(error)
        getWindowList(application, name)
      })
    }

    const getWindowList = (application, name) => {
      application.GetWindowList((error, windowNames) => {
        if (error || windowNames.length === 0) return callback(error)
        _getWindow(name, windowNames[0])
      })
    }

    const _getWindow = (name, windowName) => {
      this.bus.getInterface(name, windowName, 'org.gnome.evince.Window', (error, windowInterface) => {
        if (error) return callback(error)
        this.windows[texPath] = windowInterface
        windowInterface.on('SyncSource', SyncSource)
        windowInterface.on('Closed', () => delete this.windows[texPath])
        callback(null, windowInterface)
      })
    }

    if (this.windows[texPath]) return callback(null, this.windows[texPath])
    this.getDaemon((error, daemon) => {
      if (error) return callback(error)
      findDocument(daemon)
    })
  }

  open (filePath, texPath, lineNumber, callback) {
    this.getWindow(filePath, texPath, (error, windowInterface) => {
      if (!error) {
        // The window interface does not seem to work with file protocol
        windowInterface.SyncView(texPath, [lineNumber, 0], 0)
      }
      if (callback) callback(error)
    })
  }
}
