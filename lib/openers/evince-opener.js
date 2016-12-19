/* @flow */

import Opener from '../opener'
import url from 'url'
import type { DbusNames, UnaryFunction } from '../types'

// https://github.com/GNOME/evince/blob/master/shell/ev-gdbus.xml
// https://github.com/GNOME/evince/blob/master/shell/ev-daemon-gdbus.xml

type WindowInstance = {
  evinceWindow: Object,
  fdApplication?: Object,
  onClosed: Function
}

const DBUS_NAMES: DbusNames = {
  applicationObject: '/org/gnome/evince/Evince',
  applicationInterface: 'org.gnome.evince.Application',

  daemonService: 'org.gnome.evince.Daemon',
  daemonObject: '/org/gnome/evince/Daemon',
  daemonInterface: 'org.gnome.evince.Daemon',

  windowInterface: 'org.gnome.evince.Window',

  fdApplicationObject: '/org/gtk/Application/anonymous',
  fdApplicationInterface: 'org.freedesktop.Application'
}

function syncSource (uri: string, point): void {
  const pathName: ?string = url.parse(uri).pathname
  if (!pathName) return
  const filePath: string = decodeURI(pathName)
  atom.workspace.open(filePath).then(editor => editor.setCursorBufferPosition(point))
}

export default class EvinceOpener extends Opener {
  windows: Map<string, WindowInstance> = new Map()
  daemon: Object
  name: string
  dbusNames: Object
  bus: Object

  constructor (name: string = 'Evince', dbusNames: DbusNames = DBUS_NAMES): void {
    super()
    this.name = name
    this.dbusNames = dbusNames
    this.initialize()
  }

  dispose (): void {
    for (const texPath: string of Array.from(this.windows.keys())) {
      this.disposeWindow(texPath)
    }
  }

  async initialize (): Promise<void> {
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
    const documentName: string = await this.findDocument(filePath)

    // Get the application interface and get the window list of the application
    const evinceApplication: Object = await this.getInterface(documentName, this.dbusNames.applicationObject, this.dbusNames.applicationInterface)
    const windowNames: Array<string> = await this.getWindowList(evinceApplication)

    // Get the window interface of the of the first (only) window
    const onClosed: Function = (): void => this.disposeWindow(texPath)
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

  disposeWindow (texPath: string): void {
    const windowInstance: ?WindowInstance = this.windows.get(texPath)
    if (windowInstance) {
      windowInstance.evinceWindow.removeListener('SyncSource', syncSource)
      windowInstance.evinceWindow.removeListener('Closed', windowInstance.onClosed)
      this.windows.delete(texPath)
    }
  }

  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    try {
      const windowInstance: WindowInstance = await this.getWindow(filePath, texPath)
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

  getInterface (serviceName: string, objectPath: string, interfaceName: string): Promise<Object> {
    return new Promise((resolve: UnaryFunction, reject: UnaryFunction) => {
      this.bus.getInterface(serviceName, objectPath, interfaceName, (error: any, interfaceInstance: Object) => {
        if (error) {
          reject(error)
        } else {
          resolve(interfaceInstance)
        }
      })
    })
  }

  getWindowList (evinceApplication: Object): Promise<Array<string>> {
    return new Promise((resolve: UnaryFunction, reject: UnaryFunction) => {
      evinceApplication.GetWindowList((error: any, windowNames: Array<string>) => {
        if (error) {
          reject(error)
        } else {
          resolve(windowNames)
        }
      })
    })
  }

  findDocument (filePath: string): Promise<string> {
    return new Promise((resolve: UnaryFunction, reject: UnaryFunction) => {
      const uri: string = url.format({
        protocol: 'file:',
        slashes: true,
        pathname: encodeURI(filePath)
      })

      this.daemon.FindDocument(uri, true, (error: any, documentName: string) => {
        if (error) {
          reject(error)
        } else {
          resolve(documentName)
        }
      })
    })
  }
}
