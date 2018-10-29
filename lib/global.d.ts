import { CompositeDisposable } from 'atom'

import BuilderRegistry from './builder-registry'
import Composer from './composer'
import Logger from './logger'
import OpenerRegistry from './opener-registry'
import ProcessManager from './process-manager'
import StatusIndicator from './status-indicator'

declare interface LatexGlobal extends CompositeDisposable {
  builderRegistry: BuilderRegistry
  composer: Composer
  log: Logger
  opener: OpenerRegistry
  process: ProcessManager
  status: StatusIndicator
}

declare global {
  const latex: LatexGlobal
}

declare global {
  namespace NodeJS {
    interface Global {
        latex: LatexGlobal
    }
  }
}
