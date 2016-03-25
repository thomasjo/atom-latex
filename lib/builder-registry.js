'use babel'

import fs from 'fs-plus'
import path from 'path'

export default class BuilderRegistry {
  getBuilder (filePath) {
    const builders = this.getAllBuilders()
    const candidates = builders.filter((builder) => builder.canProcess(filePath))
    switch (candidates.length) {
      case 0: return null
      case 1: return candidates[0]
    }

    return this.resolveAmbigiousBuilders(candidates)
  }

  getAllBuilders () {
    const moduleDir = path.join(__dirname, 'builders')
    const entries = fs.readdirSync(moduleDir)
    const builders = entries.map((entry) => require(path.join(moduleDir, entry)))

    return builders
  }

  resolveAmbigiousBuilders (builders) {
    const names = builders.map((builder) => builder.name)
    const indexOfLatexmk = names.indexOf('LatexmkBuilder')
    const indexOfTexify = names.indexOf('TexifyBuilder')
    if (names.length === 2 && indexOfLatexmk >= 0 && indexOfTexify >= 0) {
      switch (atom.config.get('latex.builder')) {
        case 'latexmk': return builders[indexOfLatexmk]
        case 'texify': return builders[indexOfTexify]
      }
    }

    throw Error('Unable to resolve ambigous builder registration')
  }
}
