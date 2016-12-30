/** @babel */

import path from 'path'
import Parser from '../parser.js'

const MESSAGE_PATTERN = /^[^>]+> (INFO|WARN|ERROR) - (.*)$/

function normalizeType (type) {
  return type === 'WARN' ? 'warning' : type.toLowerCase()
}

export default class BiberLogParser extends Parser {
  constructor (filePath, texFilePath) {
    super(filePath)
    this.texFilePath = texFilePath
    this.projectPath = path.dirname(texFilePath)
  }

  parse () {
    const messages = []
    const lines = this.getLines()
    const logPath = this.filePath

    lines.forEach((line, index) => {
      const logRange = [[index, 0], [index, line.length]]

      const match = line.match(MESSAGE_PATTERN)
      if (match) {
        messages.push({
          type: normalizeType(match[1]),
          text: match[2],
          logPath,
          logRange
        })
      }
    })

    return messages
  }
}
