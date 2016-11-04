/** @babel */

import Parser from '../parser.js'
import path from 'path'

const OUTPUT_PATTERN = new RegExp('' +
  '^Output\\swritten\\son\\s' + // Leading text.
  '(.*)' +                      // Output path.
  '\\s\\(.*\\)\\.$'             // Trailing text.
)

// Error pattern
const ERROR_PATTERN = new RegExp('' +
  '^(?:(.*):(\\d+):|!)' + // File path and line number
  '(?: (.+) Error:)? ' +  // Error type
  '(.+?)\\.?$'           // Message text, the ending period is optional for MiKTeX
)

// Pattern for overfull/underfull boxes
const BOX_PATTERN = new RegExp('' +
  '^((?:Over|Under)full \\\\[vh]box \\([^)]*\\))' + // Message text
  ' in paragraph at lines (\\d+)--(\\d+)$'          // Line range
)

// Warning and Info pattern
const WARNING_INFO_PATTERN = new RegExp('' +
  '^((?:(?:Class|Package) \\S+)|LaTeX|LaTeX Font) ' + // Message origin
  '(Warning|Info):\\s+' +                             // Message type
  '(.*?)' +                                           // Message text
  '(?: on input line (\\d+))?\\.$'                    // Line number
)

// Pattern for font messages that overflow onto the next line. We do not capture
// anything from the match, but we need to know where the error message is
// located in the log file.
const INCOMPLETE_FONT_PATTERN = /^LaTeX Font .*[^.]$/

export default class LogParser extends Parser {
  constructor (filePath, texFilePath) {
    super(filePath)
    this.texFilePath = texFilePath
    this.projectPath = path.dirname(texFilePath)
  }

  parse () {
    const result = {
      logFilePath: this.filePath,
      outputFilePath: null,
      messages: []
    }

    const lines = this.getLines()
    lines.forEach((line, index) => {
      // Simplest Thing That Works™ and KISS®
      const logRange = [[index, 0], [index, line.length]]
      let match = line.match(OUTPUT_PATTERN)
      if (match) {
        const filePath = match[1].replace(/"/g, '') // TODO: Fix with improved regex.
        result.outputFilePath = path.resolve(this.projectPath, filePath)
        return
      }

      match = line.match(ERROR_PATTERN)
      if (match) {
        const lineNumber = match[2] ? parseInt(match[2], 10) : undefined
        result.messages.push({
          type: 'error',
          text: (match[3] && match[3] !== 'LaTeX') ? match[3] + ': ' + match[4] : match[4],
          filePath: match[1] ? path.resolve(this.projectPath, match[1]) : this.texFilePath,
          range: lineNumber ? [[lineNumber - 1, 0], [lineNumber - 1, 65536]] : undefined,
          logPath: this.filePath,
          logRange: logRange
        })
        return
      }

      match = line.match(BOX_PATTERN)
      if (match) {
        result.messages.push({
          type: 'warning',
          text: match[1],
          filePath: this.texFilePath,
          range: [[parseInt(match[2], 10) - 1, 0], [parseInt(match[3], 10) - 1, 65536]],
          logPath: this.filePath,
          logRange: logRange
        })
        return
      }

      match = (INCOMPLETE_FONT_PATTERN.test(line) ? line + lines[index + 1].substring(15) : line).match(WARNING_INFO_PATTERN)
      if (match) {
        const lineNumber = match[4] ? parseInt(match[4], 10) : undefined
        result.messages.push({
          type: match[2].toLowerCase(),
          text: ((match[1] !== 'LaTeX') ? match[1] + ': ' + match[3] : match[3]).replace(/\s+/g, ' '),
          filePath: this.texFilePath,
          range: lineNumber ? [[lineNumber - 1, 0], [lineNumber - 1, 65536]] : undefined,
          logPath: this.filePath,
          logRange: logRange
        })
        return
      } })

    return result
  }
}
