/** @babel */

import _ from 'lodash'
import ProcessManager from './process-manager'
import StatusIndicator from './status-indicator'
import OpenerRegistry from './opener-registry'

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
  status = new StatusIndicator()
  opener = new OpenerRegistry()

  constructor () {
    this.createLogProxy()
    defineDefaultProperty(this, 'logger')
  }

  getLogger () { return this.logger }

  setLogger (logger) {
    this.logger = logger
  }

  getDefaultLogger () {
    const DefaultLogger = require('./loggers/default-logger')
    return new DefaultLogger()
  }

  createLogProxy () {
    this.log = {
      error: (...args) => {
        this.logger.error(...args)
      },
      warning: (...args) => {
        this.logger.warning(...args)
      },
      info: (...args) => {
        this.logger.info(...args)
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
}
