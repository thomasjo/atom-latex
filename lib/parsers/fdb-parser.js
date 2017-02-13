/* @flow */

import Parser from '../parser.js'

const SECTION_PATTERN: RegExp = /^\["([^"]+)"]/
const GROUP_PATTERN: RegExp = /^\s+\(([^)]+)\)/
const FILE_PATTERN: RegExp = /^\s+"([^"]*)"/

export default class FdbParser extends Parser {
  parse (): ?Object {
    let results: Object = {}
    let section: string
    let group: string

    for (const line: string of this.getLines()) {
      const sectionMatch: ?Array<string> = line.match(SECTION_PATTERN)
      if (sectionMatch) {
        section = sectionMatch[1]
        results[section] = {}
        group = 'source'
        results[section][group] = []
        continue
      }

      if (!section) continue

      const groupMatch: ?Array<string> = line.match(GROUP_PATTERN)
      if (groupMatch) {
        group = groupMatch[1]
        if (!results[section][group]) {
          results[section][group] = []
        }
        continue
      }

      if (!group) continue

      const fileMatch: ?Array<string> = line.match(FILE_PATTERN)
      if (fileMatch) {
        results[section][group].push(fileMatch[1])
      }
    }

    return results
  }
}
