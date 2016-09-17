/** @babel */

import fs from 'fs-plus'

const sectionRegExp = /\["([^\]]+)"\]/
const generatedRegExp = /\(generated\)/
const fileRegExp = /^\s*"([^"]*)"/

export default class FdbParser {
  constructor (filePath) {
    this.filePath = filePath
  }

  parse () {
    let results = {}
    let state = 0
    let section

    for (const line of this.getLines()) {
      const sectionMatch = line.match(sectionRegExp)
      if (sectionMatch) {
        section = sectionMatch[1]
        results[section] = []
        state = 1
      } else {
        switch (state) {
          case 1:
            if (line.match(generatedRegExp)) {
              state = 2
            }
            break
          case 2:
            const fileMatch = line.match(fileRegExp)
            if (fileMatch) {
              results[section].push(fileMatch[1])
            }
            break
        }
      }
    }

    return results
  }

  getLines () {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`No such file: ${this.filePath}`)
    }

    const rawFile = fs.readFileSync(this.filePath, {encoding: 'utf-8'})
    const lines = rawFile.replace(/(\r\n)|\r/g, '\n').split('\n')
    return lines
  }
}
