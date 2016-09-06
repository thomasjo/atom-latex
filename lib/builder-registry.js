/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import MagicParser from './parsers/magic-parser'

export default class BuilderRegistry {
  getBuilder (filePath) {
    const builders = this.getAllBuilders()
    const candidates = builders.filter((builder) => builder.canProcess(filePath))
    switch (candidates.length) {
      case 0: return null
      case 1: return candidates[0]
    }

    return this.resolveAmbiguousBuilders(candidates, this.getBuilderFromMagic(filePath))
  }

  getBuilderFromMagic (filePath) {
    const magic = new MagicParser(filePath).parse()
    if (magic && magic.builder) {
      return magic.builder
    }

    return null
  }

  getAllBuilders () {
    const moduleDir = path.join(__dirname, 'builders')
    const entries = fs.readdirSync(moduleDir)
    const builders = entries.map((entry) => require(path.join(moduleDir, entry)))

    return builders
  }

  resolveAmbiguousBuilders (builders, builderOverride) {
    function findBuilder (name) {
      const namePattern = new RegExp(`^${name}Builder$`, 'i')
      return _.find(builders, builder => builder.name.match(namePattern))
    }

    let builder

    if (builderOverride) {
      builder = findBuilder(builderOverride)
      if (builder) return builder
      latex.log.warning(`Unable to resolve builder named ${builderOverride} from TEX magic, using global configuration builder.`)
    }

    const name = atom.config.get('latex.builder')
    builder = findBuilder(name)
    if (builder) return builder

    latex.log.error(`Unable to resolve builder named ${name} from global configuration, using final fallback ${builders[0].name}.`)
    return builders[0]
  }
}
