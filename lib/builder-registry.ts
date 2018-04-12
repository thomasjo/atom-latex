import fs from 'fs'
import path from 'path'
import BuildState from './build-state'

export default class BuilderRegistry {
  getBuilderImplementation (state: BuildState) {
    const builders = this.getAllBuilders()
    const candidates = builders.filter(builder => builder.canProcess(state))
    switch (candidates.length) {
      case 0: return null
      case 1: return candidates[0]
    }

    // This should never happen...
    throw new Error('Ambiguous builder registration.')
  }

  getBuilder (state: BuildState) {
    const BuilderImpl = this.getBuilderImplementation(state)
    return (BuilderImpl != null) ? new BuilderImpl() : null
  }

  async checkRuntimeDependencies () {
    const builders = this.getAllBuilders()
    for (const BuilderImpl of builders) {
      const builder = new BuilderImpl()
      await builder.checkRuntimeDependencies()
    }
  }

  getAllBuilders () {
    const moduleDir = this.getModuleDirPath()
    const entries = fs.readdirSync(moduleDir)
    const builders = entries.map(entry => require(path.join(moduleDir, entry)).default)

    return builders
  }

  getModuleDirPath () {
    return path.join(__dirname, 'builders')
  }
}
