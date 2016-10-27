/** @babel */

import _ from 'lodash'
import Composer from './composer'
import OpenerRegistry from './opener-registry'
import ProcessManager from './process-manager'
import StatusIndicator from './status-indicator'

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
  constructor () {
    this.createLogProxy()
    defineDefaultProperty(this, 'logger')

    this.defineProperty('composer', new Composer())
    this.defineProperty('opener', new OpenerRegistry())
    this.defineProperty('process', new ProcessManager())
    this.defineProperty('status', new StatusIndicator())
  }

  defineProperty (name, value) {
    Object.defineProperty(this, name, { value })
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
