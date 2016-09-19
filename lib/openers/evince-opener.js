/** @babel */

import Opener from '../opener'
import dbus from 'dbus-native'
import url from 'url'

const EVINCE_OBJECT = '/org/gnome/evince/Evince'
const EVINCE_APPLICATION_INTERFACE = 'org.gnome.evince.Application'

const DAEMON_SERVICE = 'org.gnome.evince.Daemon'
const DAEMON_OBJECT = '/org/gnome/evince/Daemon'
const DAEMON_INTERFACE = 'org.gnome.evince.Daemon'

const WINDOW_INTERFACE = 'org.gnome.evince.Window'

function syncSource (uri, point) {
  atom.workspace.open(url.parse(uri).pathname).then(editor => editor.setCursorBufferPosition(point))
}

function getInterface (bus, serviceName, objectName, interfaceName) {
  return new Promise((resolve, reject) => {
    bus.getInterface(serviceName, objectName, interfaceName, (error, interfaceInstance) => {
      if (error) {
        reject(error)
      } else {
        resolve(interfaceInstance)
      }
    })
  })
}

function getWindowList (application) {
  return new Promise((resolve, reject) => {
    application.GetWindowList((error, windowNames) => {
      if (error) {
        reject(error)
      } else {
        resolve(windowNames)
      }
    })
  })
}

function findDocument (daemon, filePath) {
  return new Promise((resolve, reject) => {
    const uri = url.format({ protocol: 'file:', slashes: true, pathname: filePath })
    console.log(uri)
    daemon.FindDocument(uri, true, (error, documentName) => {
      console.log('sdf')
      if (error) {
        reject(error)
      } else {
        resolve(documentName)
      }
    })
  })
}

export default class EvinceOpener extends Opener {
  constructor () {
    super()
    this.bus = dbus.sessionBus()
    this.windows = {}
  }

  async getWindow (filePath, texPath) {
    if (this.windows[texPath]) return this.windows[texPath]

    const daemon = await getInterface(this.bus, DAEMON_SERVICE, DAEMON_OBJECT, DAEMON_INTERFACE)
    const documentName = await findDocument(daemon, filePath)
    const application = await getInterface(this.bus, documentName, EVINCE_OBJECT, EVINCE_APPLICATION_INTERFACE)
    const windows = await getWindowList(application)
    const windowInterface = await getInterface(this.bus, documentName, windows[0], WINDOW_INTERFACE)

    this.windows[texPath] = windowInterface
    windowInterface.on('SyncSource', syncSource)
    windowInterface.on('Closed', () => delete this.windows[texPath])

    return windowInterface
  }

  open (filePath, texPath, lineNumber, callback) {
    this.getWindow(filePath, texPath)
      .then(windowInterface => {
        console.log(windowInterface)
        windowInterface.SyncView(texPath, [lineNumber, 0], 0)
        if (callback) callback(0)
      }, error => {
        if (callback) callback(error)
      })
  }
}
