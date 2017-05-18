/** @babel */

import Composer from './composer'
import OpenerRegistry from './opener-registry'
import ProcessManager from './process-manager'
import StatusIndicator from './status-indicator'
import BuilderRegistry from './builder-registry'
import Logger from './logger'
import { CompositeDisposable, Disposable } from 'atom'

function defineImmutableProperty (obj, name, value) {
  if (Disposable.isDisposable(value)) {
    obj.disposables.add(value)
  }
  Object.defineProperty(obj, name, { value })
}

export default class Latex extends Disposable {
  disposables = new CompositeDisposable()

  constructor () {
    super(() => this.disposables.dispose())

    defineImmutableProperty(this, 'builderRegistry', new BuilderRegistry())
    defineImmutableProperty(this, 'composer', new Composer())
    defineImmutableProperty(this, 'log', new Logger())
    defineImmutableProperty(this, 'opener', new OpenerRegistry())
    defineImmutableProperty(this, 'process', new ProcessManager())
    defineImmutableProperty(this, 'status', new StatusIndicator())
  }
}
