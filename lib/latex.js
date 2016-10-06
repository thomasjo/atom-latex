/** @babel */

import fs from 'fs-plus'
import _ from 'lodash'
import { heredoc } from './werkzeug'
import ProcessManager from './process-manager'

function defineDefaultProperty (target, property) {
  const shadowProperty = `__${property}`
  const defaultGetter = `getDefault${_.capitalize(property)}`

  Object.defineProperty(target, property, {
    get: function () {
      if (!target[shadowProperty]) {
        target[shadowProperty] = target[defaultGetter].apply(target)
      }
      return target[shadowProperty]
    },

    set: function (value) { target[shadowProperty] = value }
  })
}

export default class Latex {
  process = new ProcessManager()

  constructor () {
    this.createLogProxy()

    defineDefaultProperty(this, 'logger')
    defineDefaultProperty(this, 'opener')

    this.observeOpenerConfig()
  }

  getLogger () { return this.logger }
  getOpener () { return this.opener }

  setLogger (logger) {
    this.logger = logger
  }

  attachStatusBar (statusBar) {
    const StatusIndicator = require('./views/status-indicator')
    this.statusIndicator = new StatusIndicator({ type: 'idle' })
    this.statusTile = statusBar.addRightTile({
      item: this.statusIndicator,
      priority: 9001
    })
  }

  detachStatusBar () {
    if (this.statusTile) {
      this.statusTile.destroy()
      this.statusTile = null
    }
    if (this.statusIndicator) {
      this.statusIndicator.destroy()
      this.statusIndicator = null
    }
  }

  setStatus (text, type, icon, spin, title, onClick) {
    if (this.statusIndicator) {
      this.statusIndicator.update({ text, type, icon, spin, title, onClick })
    }
  }

  getDefaultLogger () {
    const DefaultLogger = require('./loggers/default-logger')
    return new DefaultLogger()
  }

  getDefaultOpener () {
    const OpenerImpl = this.resolveOpenerImplementation(process.platform)
    if (OpenerImpl) {
      return new OpenerImpl()
    }

    if (this['__logger'] && this.log) {
      this.log.warning(heredoc(`
        No PDF opener found.
        For cross-platform viewing, consider installing the pdf-view package.
        `)
      )
    }
  }

  createLogProxy () {
    this.log = {
      error: (statusCode, result, builder) => {
        this.logger.error(statusCode, result, builder)
      },
      warning: (message) => {
        this.logger.warning(message)
      },
      info: (message) => {
        this.logger.info(message)
      },
      showMessage: (message) => {
        this.logger.showMessage(message)
      },
      group: (label) => {
        this.logger.group(label)
      },
      groupEnd: () => {
        this.logger.groupEnd()
      },
      sync: () => {
        this.logger.sync()
      },
      toggle: () => {
        this.logger.toggle()
      },
      show: () => {
        this.logger.show()
      },
      hide: () => {
        this.logger.hide()
      }
    }
  }

  observeOpenerConfig () {
    const callback = () => { this['__opener'] = this.getDefaultOpener() }
    atom.config.onDidChange('latex.alwaysOpenResultInAtom', callback)
    atom.config.onDidChange('latex.skimPath', callback)
    atom.config.onDidChange('latex.sumatraPath', callback)
    atom.config.onDidChange('latex.okularPath', callback)
  }

  resolveOpenerImplementation (platform) {
    if (this.hasPdfViewerPackage() && this.shouldOpenResultInAtom()) {
      return require('./openers/atompdf-opener')
    }

    if (this.viewerExecutableExists()) {
      return require('./openers/custom-opener')
    }

    switch (platform) {
      case 'darwin':
        if (this.skimExecutableExists()) {
          return require('./openers/skim-opener')
        }

        return require('./openers/preview-opener')

      case 'win32':
        if (this.sumatraExecutableExists()) {
          return require('./openers/sumatra-opener')
        }

        break

      case 'linux':
        if (this.okularExecutableExists()) {
          return require('./openers/okular-opener')
        }

        if (this.evinceExecutableExists()) {
          return require('./openers/evince-opener')
        }

        return require('./openers/xdg-opener')
    }

    if (this.hasPdfViewerPackage()) {
      return require('./openers/atompdf-opener')
    }

    return null
  }

  hasPdfViewerPackage () {
    return !!atom.packages.resolvePackagePath('pdf-view')
  }

  shouldOpenResultInAtom () {
    return atom.config.get('latex.alwaysOpenResultInAtom')
  }

  skimExecutableExists () {
    return fs.existsSync(atom.config.get('latex.skimPath'))
  }

  sumatraExecutableExists () {
    return fs.existsSync(atom.config.get('latex.sumatraPath'))
  }

  okularExecutableExists () {
    return fs.existsSync(atom.config.get('latex.okularPath'))
  }

  evinceExecutableExists () {
    return fs.existsSync(atom.config.get('latex.evincePath'))
  }

  viewerExecutableExists () {
    return fs.existsSync(atom.config.get('latex.viewerPath'))
  }
}
