/* @flow */

import _ from 'lodash'
import Composer from './composer'
import OpenerRegistry from './opener-registry'
import ProcessManager from './process-manager'
import StatusIndicator from './status-indicator'
import BuilderRegistry from './builder-registry'
import { CompositeDisposable, Disposable } from 'atom'
import Logger from './logger'
import DefaultLogger from './loggers/default-logger'

function defineDefaultProperty (target: Object, property: string): void {
  const shadowProperty: string = `__${property}`
  const defaultGetter: string = `getDefault${_.capitalize(property)}`

  Object.defineProperty(target, property, {
    get: function (): any {
      if (!target[shadowProperty]) {
        target[shadowProperty] = target[defaultGetter].apply(target)
      }
      return target[shadowProperty]
    },

    set: function (value: any): void { target[shadowProperty] = value }
  })
}

function defineImmutableProperty (obj: Object, name: string, value: Object): void {
  if (Disposable.isDisposable(value)) {
    obj.disposables.add(value)
  }
  Object.defineProperty(obj, name, { value })
}

export default class Latex {
  disposables: CompositeDisposable = new CompositeDisposable()
  logger: Logger
  log: Object

  constructor (): void {
    this.createLogProxy()
    defineDefaultProperty(this, 'logger')

    defineImmutableProperty(this, 'builderRegistry', new BuilderRegistry())
    defineImmutableProperty(this, 'composer', new Composer())
    defineImmutableProperty(this, 'opener', new OpenerRegistry())
    defineImmutableProperty(this, 'process', new ProcessManager())
    defineImmutableProperty(this, 'status', new StatusIndicator())
  }

  dispose (): void {
    this.disposables.dispose()
  }

  getLogger (): Logger { return this.logger }

  setLogger (logger: Logger): void {
    this.logger = logger
  }

  getDefaultLogger (): Logger {
    return new DefaultLogger()
  }

  createLogProxy (): void {
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
