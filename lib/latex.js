'use babel'

import fs from 'fs-plus'
import _ from 'lodash'
import { heredoc } from './werkzeug'

function defineDefaultProperty (target, property) {
  const shadowProperty = `__${property}`
  const defaultGetter = `getDefault${_.capitalize(property)}`

  Object.defineProperty(target, property, {
    get () {
      if (!target[shadowProperty]) {
        target[shadowProperty] = target[defaultGetter].apply(target)
      }
      return target[shadowProperty]
    },

    set (value) { target[shadowProperty] = value }
  })
}

export default class Latex {
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

  getDefaultLogger () {
    const ConsoleLogger = require('./loggers/console-logger')
    return new ConsoleLogger()
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
      warning: message => {
        this.logger.warning(message)
      },
      info: message => {
        this.logger.info(message)
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

  viewerExecutableExists () {
    return fs.existsSync(atom.config.get('latex.viewerPath'))
  }
}
