/* @flow */

import Opener from '../opener'
import url from 'url'

type WindowInstance = {
  evinceWindow: Object,
  fdApplication?: Object,
  onClosed: Function
}

const DBUS_NAMES = {
  applicationObject: '/org/gnome/evince/Evince',
  applicationInterface: 'org.gnome.evince.Application',

  daemonService: 'org.gnome.evince.Daemon',
  daemonObject: '/org/gnome/evince/Daemon',
  daemonInterface: 'org.gnome.evince.Daemon',

  windowInterface: 'org.gnome.evince.Window',

  fdApplicationObject: '/org/gtk/Application/anonymous',
  fdApplicationInterface: 'org.freedesktop.Application'
}

function syncSource (uri: string, point) {
  const pathName = url.parse(uri).pathname
  if (!pathName) return
  const filePath = decodeURI(pathName)
  atom.workspace.open(filePath).then(editor => editor.setCursorBufferPosition(point))
}

export default class EvinceOpener extends Opener {
  windows: Map<string, WindowInstance> = new Map()
  daemon: Object
  name: string
  dbusNames: Object
  bus: Object

  constructor (name: string = 'Evince', dbusNames: Object = DBUS_NAMES) {
    super()
    this.name = name
    this.dbusNames = dbusNames
    this.initialize()
  }

  dispose () {
    for (const texPath of Array.from(this.windows.keys())) {
      this.disposeWindow(texPath)
    }
  }

  async initialize () {
    try {
      if (process.platform === 'linux') {
        const dbus = require('dbus-native')
        this.bus = dbus.sessionBus()
        this.daemon = await this.getInterface(this.dbusNames.daemonService, this.dbusNames.daemonObject, this.dbusNames.daemonInterface)
      }
    } catch (e) {}
  }

  async getWindow (filePath: string, texPath: string): Promise<WindowInstance> {
    let windowInstance: ?WindowInstance = this.windows.get(texPath)
    if (windowInstance) {
      return windowInstance
    }

    // First find the internal document name
    const documentName = await this.findDocument(filePath)

    // Get the application interface and get the window list of the application
    const evinceApplication = await this.getInterface(documentName, this.dbusNames.applicationObject, this.dbusNames.applicationInterface)
    const windowNames = await this.getWindowList(evinceApplication)

    // Get the window interface of the of the first (only) window
    const onClosed = () => this.disposeWindow(texPath)
    windowInstance = {
      evinceWindow: await this.getInterface(documentName, windowNames[0], this.dbusNames.windowInterface),
      onClosed
    }

    if (this.dbusNames.fdApplicationObject) {
      // Get the GTK/FreeDesktop application interface so we can activate the window
      windowInstance.fdApplication = await this.getInterface(documentName, this.dbusNames.fdApplicationObject, this.dbusNames.fdApplicationInterface)
    }

    windowInstance.evinceWindow.on('SyncSource', syncSource)
    windowInstance.evinceWindow.on('Closed', windowInstance.onClosed)
    this.windows.set(texPath, windowInstance)

    // This seems to help with future syncs
    windowInstance.evinceWindow.SyncView(texPath, [0, 0], 0)

    return windowInstance
  }

  disposeWindow (texPath: string) {
    const windowInstance = this.windows.get(texPath)
    if (windowInstance) {
      windowInstance.evinceWindow.removeListener('SyncSource', syncSource)
      windowInstance.evinceWindow.removeListener('Closed', windowInstance.onClosed)
      this.windows.delete(texPath)
    }
  }

  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    try {
      const windowInstance = await this.getWindow(filePath, texPath)
      if (!this.shouldOpenInBackground() && windowInstance.fdApplication) {
        windowInstance.fdApplication.Activate({})
      }

      // SyncView seems to want to activate the window sometimes
      windowInstance.evinceWindow.SyncView(texPath, [lineNumber, 0], 0)
    } catch (error) {
      latex.log.error(`An error occured while trying to run ${this.name} opener`)
    }
  }

  canOpen (filePath: string): boolean {
    return !!this.daemon
  }

  hasSynctex (): boolean {
    return true
  }

  canOpenInBackground (): boolean {
    return true
  }

  getInterface (serviceName: string, objectPath: string, interfaceName: string): Promise<WindowInstance> {
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

  getWindowList (evinceApplication: Object): Promise<Array<string>> {
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

  findDocument (filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uri = url.format({
        protocol: 'file:',
        slashes: true,
        pathname: encodeURI(filePath)
      })

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
