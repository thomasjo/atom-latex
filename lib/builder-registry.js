'use babel'

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
    const name = builderOverride || atom.config.get('latex.builder')
    const namePattern = new RegExp(`^${name}Builder$`, 'i')
    const builder = _.find(builders, builder => builder.name.match(namePattern))

    if (builder) return builder

    latex.log.warning(`Unable to resolve builder named ${name} using fallback ${builders[0].name}.`)
    return builders[0]
  }
}
