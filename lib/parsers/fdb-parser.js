/** @babel */

import Parser from '../parser.js'

const SECTION_PATTERN = /^\["([^"]+)"\]/
const GROUP_PATTERN = /^\s+\(([^)]+)\)/
const FILE_PATTERN = /^\s+"([^"]*)"/

export default class FdbParser extends Parser {
  parse () {
    let results = {}
    let section
    let group

    for (const line of this.getLines()) {
      const sectionMatch = line.match(SECTION_PATTERN)
      if (sectionMatch) {
        section = sectionMatch[1]
        results[section] = {}
        group = 'source'
        results[section][group] = []
        continue
      }

      if (!section) continue

      const groupMatch = line.match(GROUP_PATTERN)
      if (groupMatch) {
        group = groupMatch[1]
        if (!results[section][group]) {
          results[section][group] = []
        }
        continue
      }

      if (!group) continue

      const fileMatch = line.match(FILE_PATTERN)
      if (fileMatch) {
        results[section][group].push(fileMatch[1])
      }
    }

    return results
  }
}
