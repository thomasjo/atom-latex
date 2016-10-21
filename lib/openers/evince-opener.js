/** @babel */

import Opener from '../opener'
import url from 'url'

const EVINCE_OBJECT = '/org/gnome/evince/Evince'
const EVINCE_APPLICATION_INTERFACE = 'org.gnome.evince.Application'

const DAEMON_SERVICE = 'org.gnome.evince.Daemon'
const DAEMON_OBJECT = '/org/gnome/evince/Daemon'
const DAEMON_INTERFACE = 'org.gnome.evince.Daemon'

const WINDOW_INTERFACE = 'org.gnome.evince.Window'

const GTK_APPLICATION_OBJECT = '/org/gtk/Application/anonymous'
const GTK_APPLICATION_INTERFACE = 'org.freedesktop.Application'

function syncSource (uri, point) {
  atom.workspace.open(url.parse(uri).pathname).then(editor => editor.setCursorBufferPosition(point))
}

export default class EvinceOpener extends Opener {
  constructor () {
    super()
    this.windows = {}
    this.initialize()
  }

  async initialize () {
    try {
      if (process.platform === 'linux') {
        const dbus = require('dbus-native')
        this.bus = dbus.sessionBus()
        this.daemon = await this.getInterface(DAEMON_SERVICE, DAEMON_OBJECT, DAEMON_INTERFACE)
      }
    } catch (e) {}
  }

  async getWindow (filePath, texPath) {
    if (this.windows[texPath]) return this.windows[texPath]

    // First find the internal document name
    const documentName = await this.findDocument(filePath)

    // Get the application interface and get the window list of the application
    const evinceApplication = await this.getInterface(documentName, EVINCE_OBJECT, EVINCE_APPLICATION_INTERFACE)
    const windowNames = await this.getWindowList(evinceApplication)

    // Get the window interface of the of the first (only) window and get the
    // GTK/FreeDesktop application interface so we can activate the window
    const interfaces = {
      evinceWindow: await this.getInterface(documentName, windowNames[0], WINDOW_INTERFACE),
      gtkApplication: await this.getInterface(documentName, GTK_APPLICATION_OBJECT, GTK_APPLICATION_INTERFACE)
    }

    interfaces.evinceWindow.on('SyncSource', syncSource)
    interfaces.evinceWindow.on('Closed', () => delete this.windows[texPath])
    this.windows[texPath] = interfaces

    // This seems to help with future syncs
    interfaces.evinceWindow.SyncView(texPath, [0, 0], 0)

    return interfaces
  }

  async open (filePath, texPath, lineNumber) {
    try {
      const interfaces = await this.getWindow(filePath, texPath)
      if (!this.shouldOpenInBackground()) {
        interfaces.gtkApplication.Activate({})
      }

      // SyncView seems to want to activate the window sometimes
      interfaces.evinceWindow.SyncView(texPath, [lineNumber, 0], 0)

      return true
    } catch (error) {
      latex.log.error('An error occured while trying to run Evince opener')
      return false
    }
  }

  canOpen (filePath) {
    return !!this.daemon
  }

  hasSynctex () {
    return true
  }

  canOpenInBackground () {
    return true
  }

  getInterface (serviceName, objectPath, interfaceName) {
    return new Promise((resolve, reject) => {
      this.bus.getInterface(serviceName, objectPath, interfaceName, (error, interfaceInstance) => {
        if (error) {
          reject(error)
        } else {
          resolve(interfaceInstance)
        }
      })
    })
  }

  getWindowList (evinceApplication) {
    return new Promise((resolve, reject) => {
      evinceApplication.GetWindowList((error, windowNames) => {
        if (error) {
          reject(error)
        } else {
          resolve(windowNames)
        }
      })
    })
  }

  findDocument (filePath) {
    return new Promise((resolve, reject) => {
      const uri = url.format({ protocol: 'file:', slashes: true, pathname: filePath })
      this.daemon.FindDocument(uri, true, (error, documentName) => {
        if (error) {
          reject(error)
        } else {
          resolve(documentName)
        }
      })
    })
  }
}
