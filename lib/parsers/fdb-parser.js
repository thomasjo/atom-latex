/** @babel */

import Parser from '../parser.js'

const SECTION_PATTERN = /\["([^\]]+)"\]/
const GENERATED_PATTERN = /\(generated\)/
const FILE_PATTERN = /^\s*"([^"]*)"/

export default class FdbParser extends Parser {
  parse () {
    let results = {}
    let state = 0
    let section

    for (const line of this.getLines()) {
      const sectionMatch = line.match(SECTION_PATTERN)
      if (sectionMatch) {
        section = sectionMatch[1]
        results[section] = []
        state = 1
      } else {
        switch (state) {
          case 1:
            if (line.match(GENERATED_PATTERN)) {
              state = 2
            }
            break
          case 2:
            const fileMatch = line.match(FILE_PATTERN)
            if (fileMatch) {
              results[section].push(fileMatch[1])
            }
            break
        }
      }
    }

    return results
  }
}
