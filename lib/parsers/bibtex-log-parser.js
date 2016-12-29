/** @babel */

import path from 'path'
import Parser from '../parser.js'

const WARNING_PATTERN = /^Warning--(.+)$/
const FILE_REFERENCE_PATTERN = /^(?:\n--line (\d+) of file (.+))?$/
const ERROR_PATTERN = /^(.*)---line (\d+) of file (.*)$/
const BAD_CROSS_REFERENCE_PATTERN = /^A bad cross reference---entry "[^"]*"$/

export default class BibtexLogParser extends Parser {
  constructor (filePath, texFilePath) {
    super(filePath)
    this.texFilePath = texFilePath
    this.projectPath = path.dirname(texFilePath)
  }

  parse () {
    const messages = []
    const lines = this.getLines()
    let match
    let message
    let lineNumber

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const logRange = [[index, 0], [index, line.length]]

      match = line.match(WARNING_PATTERN)
      if (match) {
        message = {
          type: 'warning',
          text: match[1],
          logPath: this.filePath,
          logRange: logRange
        }

        match = lines[index + 1].match(FILE_REFERENCE_PATTERN)
        if (match) {
          index++
          message.logRange[1] = [index, lines[index].length]
          lineNumber = parseInt(match[1])
          message.range = [[lineNumber, 0], [lineNumber, 65536]]
          message.filePath = path.resolve(this.projectPath, match[2])
        }

        messages.push(message)
        continue
      }

      match = line.match(ERROR_PATTERN)
      if (match) {
        lineNumber = parseInt(match[2])
        message = {
          type: 'error',
          text: `${match[1]}; ${lines[index + 1]}`,
          range: [[lineNumber, 0], [lineNumber, 65536]],
          filePath: path.resolve(this.projectPath, match[3]),
          logPath: this.filePath,
          logRange: [[index, 0], [index + 1, lines[index + 1].length]]
        }

        index++
        messages.push(message)

        continue
      }

      match = line.match(BAD_CROSS_REFERENCE_PATTERN)
      if (match) {
        message = {
          type: 'error',
          text: `${match[1]}; ${lines[index + 1]}`,
          logPath: this.filePath,
          logRange: [[index, 0], [index + 1, lines[index + 1].length]]
        }

        index++
        messages.push(message)

        continue
      }
    }

    return messages
  }
}
