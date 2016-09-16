/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'

const outputPattern = new RegExp('' +
  '^Output\\swritten\\son\\s' + // Leading text.
  '(.*)' +                      // Output path.
  '\\s\\(.*\\)\\.$'             // Trailing text.
)

// Error pattern
const errorPattern = new RegExp('' +
  '^(?:(?:\\.\\/)?(.*):(\\d+):|!)' + // File path and line number ignoring leading './'
  '(?: (.+) Error:)? ' +             // Error type
  '(.+?)\\.?$'                       // Message text, the ending period is optional for MiKTeX
)

// Pattern for overfull/underfull boxes
const boxPattern = new RegExp('' +
  '^((?:Over|Under)full \\\\[vh]box \\([^)]*\\))' + // Message text
  ' in paragraph at lines (\\d+)--(\\d+)$'          // Line range
)

// Warning and Info pattern
const warningInfoPattern = new RegExp('' +
  '^((?:(?:Class|Package) \\S+)|LaTeX|LaTeX Font) ' + // Message origin
  '(Warning|Info):\\s+' +                             // Message type
  '(.*?)' +                                           // Message text
  '(?: on input line (\\d+))?\\.$'                    // Line number
)

// Pattern for font messages that overflow onto the next line. We do not capture
// anything from the match, but we need to know where the error message is
// located in the log file.
const incompleteFontPattern = /^LaTeX Font .*[^.]$/

export default class LogParser {
  constructor (filePath, texFilePath) {
    this.filePath = filePath
    this.texFilePath = texFilePath
    this.projectPath = path.dirname(filePath)
  }

  parse () {
    const result = {
      logFilePath: this.filePath,
      outputFilePath: null,
      messages: []
    }

    const lines = this.getLines()
    _.forEach(lines, (line, index) => {
      // Simplest Thing That Works™ and KISS®
      const logRange = [[index, 0], [index, line.length]]
      let match = line.match(outputPattern)
      if (match) {
        const filePath = match[1].replace(/"/g, '') // TODO: Fix with improved regex.
        result.outputFilePath = path.resolve(this.projectPath, filePath)
        return
      }

      match = line.match(errorPattern)
      if (match) {
        const lineNumber = match[2] ? parseInt(match[2], 10) : undefined
        result.messages.push({
          type: 'Error',
          text: (match[3] && match[3] !== 'LaTeX') ? match[3] + ': ' + match[4] : match[4],
          filePath: match[1] ? this.alterParentPath(this.texFilePath, match[1]) : this.texFilePath,
          range: lineNumber ? [[lineNumber - 1, 0], [lineNumber - 1, 65536]] : undefined,
          logPath: this.filePath,
          logRange: logRange
        })
        return
      }

      match = line.match(boxPattern)
      if (match) {
        result.messages.push({
          type: 'Warning',
          text: match[1],
          filePath: this.texFilePath,
          range: [[parseInt(match[2], 10) - 1, 0], [parseInt(match[3], 10) - 1, 65536]],
          logPath: this.filePath,
          logRange: logRange
        })
        return
      }

      match = (incompleteFontPattern.test(line) ? line + lines[index + 1].substring(15) : line).match(warningInfoPattern)
      if (match) {
        const lineNumber = match[4] ? parseInt(match[4], 10) : undefined
        result.messages.push({
          type: match[2],
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

  getLines () {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`No such file: ${this.filePath}`)
    }

    const rawFile = fs.readFileSync(this.filePath, {encoding: 'utf-8'})
    const lines = rawFile.replace(/(\r\n)|\r/g, '\n').split('\n')
    return lines
  }

  alterParentPath (targetPath, originalPath) {
    const targetDir = path.dirname(targetPath)
    return path.join(targetDir, path.basename(originalPath))
  }

}
