/** @babel */

import path from 'path'
import Parser from '../parser.js'

const WARNING_PATTERN = /^Warning--(.+)$/
const FILE_REFERENCE_PATTERN = /^--line (\d+) of file (.+)$/
const ERROR_PATTERN = /^(.*)---line (\d+) of file (.*)$/
const BAD_CROSS_REFERENCE_PATTERN = /^A bad cross reference---entry .*$/

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
      const logPath = this.filePath
      const logRange = [[index, 0], [index, line.length]]

      match = line.match(WARNING_PATTERN)
      if (match) {
        message = {
          type: 'warning',
          text: match[1],
          logPath,
          logRange
        }

        match = lines[index + 1].match(FILE_REFERENCE_PATTERN)
        if (match) {
          index++
          message.logRange[1] = [index, lines[index].length]
          lineNumber = parseInt(match[1])
          message.range = [[lineNumber, 0], [lineNumber, 65536]]
          message.path = path.resolve(this.projectPath, match[2])
        }

        messages.push(message)
        continue
      }

      // Error messages are actually multiline messages that are terminated by
      // a line "I'm ignoring ...", but the extra lines appear to be source
      // quotes so they aren't really needed in this context.
      match = line.match(ERROR_PATTERN)
      if (match) {
        lineNumber = parseInt(match[2])
        message = {
          type: 'error',
          text: match[1],
          range: [[lineNumber, 0], [lineNumber, 65536]],
          filePath: path.resolve(this.projectPath, match[3]),
          logPath,
          logRange
        }

        messages.push(message)

        continue
      }

      match = line.match(BAD_CROSS_REFERENCE_PATTERN)
      if (match) {
        message = {
          type: 'error',
          text: `${match[0]} ${lines[index + 1]}`,
          logPath,
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
