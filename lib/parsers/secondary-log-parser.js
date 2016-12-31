/** @babel */

import path from 'path'
import Parser from '../parser.js'

const MAKEINDEX_FIRST_LINE_PATTERN = /This is makeindex/
const MAKEINDEX_WARNING_PATTERN = /## Warning \(input = (.+), line = (\d+); output = (.+), line = (\d+)\):/
const MAKEINDEX_ERROR_PATTERN = /^[*!]+ Input (?:index|style) error \(file = (.+), line = (\d+)\):$/
const MAKEINDEX_MESSAGE_PATTERN = /^\s+--\s*(.*)$/

const BIBER_FIRST_LINE_PATTERN = /This is Biber/
const BIBER_MESSAGE_PATTERN = /^[^>]+> (INFO|WARN|ERROR) - (.*)$/

const BIBTEX_FIRST_LINE_PATTERN = /This is BibTeX/
const BIBTEX_WARNING_PATTERN = /^Warning--(.+)$/
const BIBTEX_FILE_REFERENCE_PATTERN = /^--line (\d+) of file (.+)$/
const BIBTEX_ERROR_PATTERN = /^(.*)---line (\d+) of file (.*)$/
const BIBTEX_BAD_CROSS_REFERENCE_PATTERN = /^A bad cross reference---entry .*$/

function normalizeType (type) {
  return type === 'WARN' ? 'warning' : type.toLowerCase()
}

export default class SecondaryLogParser extends Parser {
  parsers = [{
    firstLinePattern: MAKEINDEX_FIRST_LINE_PATTERN,
    messageParsers: [{
      pattern: MAKEINDEX_WARNING_PATTERN,
      parse: (match, index, lines) => {
        const messageMatch = lines[index + 1].match(MAKEINDEX_MESSAGE_PATTERN)
        const lineNumber = parseInt(match[2]) - 1

        return {
          type: 'warning',
          text: messageMatch[1],
          range: [[lineNumber, 0], [lineNumber, 65536]],
          filePath: match[1],
          logRange: [[index, 0], [index + 1, lines[index + 1].length]]
        }
      }
    }, {
      pattern: MAKEINDEX_ERROR_PATTERN,
      parse: (match, index, lines) => {
        const messageMatch = lines[index + 1].match(MAKEINDEX_MESSAGE_PATTERN)
        const lineNumber = parseInt(match[2]) - 1

        return {
          type: 'error',
          text: messageMatch[1],
          range: [[lineNumber, 0], [lineNumber, 65536]],
          filePath: match[1],
          logRange: [[index, 0], [index + 1, lines[index + 1].length]]
        }
      }
    }]
  }, {
    firstLinePattern: BIBER_FIRST_LINE_PATTERN,
    messageParsers: [{
      pattern: BIBER_MESSAGE_PATTERN,
      parse: (match, index, lines) => {
        return {
          type: normalizeType(match[1]),
          text: match[2]
        }
      }
    }]
  }, {
    firstLinePattern: BIBTEX_FIRST_LINE_PATTERN,
    messageParsers: [{
      pattern: BIBTEX_WARNING_PATTERN,
      parse: (match, index, lines) => {
        const message = {
          type: 'warning',
          text: match[1]
        }

        const refMatch = lines[index + 1].match(BIBTEX_FILE_REFERENCE_PATTERN)
        if (refMatch) {
          const lineNumber = parseInt(refMatch[1]) - 1
          message.logRange = [[index, 0], [index + 1, lines[index + 1].length]]
          message.range = [[lineNumber, 0], [lineNumber, 65536]]
          message.filePath = match[2]
        }

        return message
      }
    }, {
      pattern: BIBTEX_ERROR_PATTERN,
      parse: (match, index, lines) => {
        // Error messages are actually multiline messages that are terminated by
        // a line "I'm ignoring ...", but the extra lines appear to be source
        // quotes so they aren't really needed in this context.
        const lineNumber = parseInt(match[2]) - 1

        return {
          type: 'error',
          text: match[1],
          range: [[lineNumber, 0], [lineNumber, 65536]],
          filePath: match[3]
        }
      }
    }, {
      pattern: BIBTEX_BAD_CROSS_REFERENCE_PATTERN,
      parse: (match, index, lines) => {
        return {
          type: 'error',
          text: `${match[0]} ${lines[index + 1]}`,
          logRange: [[index, 0], [index + 1, lines[index + 1].length]]
        }
      }
    }]
  }]

  constructor (filePath, texFilePath) {
    super(filePath)
    this.texFilePath = texFilePath
    this.projectPath = path.dirname(texFilePath)
  }

  parse () {
    const lines = this.getLines()
    const parser = this.parsers.find(parser => !!lines[0].match(parser.firstLinePattern))
    if (!parser) return

    const messages = []
    const logPath = this.filePath

    lines.forEach((line, index) => {
      const logRange = [[index, 0], [index + 1, line.length]]

      for (const messageParser of parser.messageParsers) {
        const match = line.match(messageParser.pattern)
        if (match) {
          const message = messageParser.parse(match, index, lines)
          message.logPath = logPath
          if (!message.logRange) {
            message.logRange = logRange
          }
          if (message.filePath) {
            message.filePath = path.resolve(this.projectPath, message.filePath)
          }
          messages.push(message)

          break
        }
      }
    })

    return messages
  }

}
