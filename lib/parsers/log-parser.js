'use babel'

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'

const outputPattern = new RegExp('' +
  '^Output\\swritten\\son\\s' + // Leading text.
  '(.*)' +                      // Output path.
  '\\s\\(.*\\)\\.$'             // Trailing text.
)

const errorPattern = new RegExp('' +
  '^(?:\\.\\/)?(.*):' +     // File path ignoring the possible ./ at the start.
  '(\\d+):' +              // Line number.
  '(?:\\sLaTeX\\sError:\\s)?' + // Marker.
  '(.*)\\.$'               // Error message.
)

export default class LogParser {
  constructor (filePath) {
    this.filePath = filePath
    this.projectPath = path.dirname(filePath)
  }

  parse () {
    const result = {
      logFilePath: this.filePath,
      outputFilePath: null,
      errors: [],
      warnings: []
    }

    const lines = this.getLines()
    _.forEach(lines, (line, index) => {
      // Simplest Thing That Works™ and KISS®
      let match = line.match(outputPattern)
      if (match) {
        const filePath = match[1].replace(/"/g, '') // TODO: Fix with improved regex.
        result.outputFilePath = path.resolve(this.projectPath, filePath)
        return
      }

      match = line.match(errorPattern)
      if (match) {
        result.errors.push({
          logPosition: [index, 0],
          filePath: match[1],
          lineNumber: parseInt(match[2], 10),
          message: match[3]
        })
        return
      }
    })

    return result
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
