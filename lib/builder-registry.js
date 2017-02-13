/* @flow */

import fs from 'fs-plus'
import path from 'path'
import { BuildState } from './build-state'
import Builder from './builder'

export default class BuilderRegistry {
  getBuilderImplementation (state: BuildState): ?Class<Builder> {
    const builders: Array<Class<Builder>> = this.getAllBuilders()
    const candidates: Array<Class<Builder>> = builders.filter((builder: Class<Builder>): boolean => builder.canProcess(state))
    switch (candidates.length) {
      case 0: return null
      case 1: return candidates[0]
    }

    // This should never happen...
    throw new Error('Ambiguous builder registration.')
  }

  getBuilder (state: BuildState): ?Builder {
    const BuilderImpl: ?Class<Builder> = this.getBuilderImplementation(state)
    return (BuilderImpl != null) ? new BuilderImpl() : null
  }

  async checkRuntimeDependencies (): Promise<void> {
    const builders: Array<Class<Builder>> = this.getAllBuilders()
    for (const BuilderImpl: Class<Builder> of builders) {
      const builder: Builder = new BuilderImpl()
      await builder.checkRuntimeDependencies()
    }
  }

  getAllBuilders (): Array<Class<Builder>> {
    const moduleDir: string = this.getModuleDirPath()
    const entries: Array<string> = fs.readdirSync(moduleDir)
    const builders: Array<Class<Builder>> = entries.map((entry: string): Class<Builder> => require(path.join(moduleDir, entry)))

    return builders
  }

  getModuleDirPath (): string {
    return path.join(__dirname, 'builders')
  }
}
