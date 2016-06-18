'use babel'

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'

const outputPattern = new RegExp('' +
  '^Output\\swritten\\son\\s' + // Leading text.
  '(.*)' +                      // Output path.
  '\\s\\(.*\\)\\.$'             // Trailing text.
)

const errorPattern = /^(?:\.\/)?(.*):(\d+):(?: (.+) Error:)? (.*)\.$/
const boxPattern = /^((?:Over|Under)full \\[vh]box \([^)]*\)) in paragraph at lines (\d+)--(\d+)$/
const warningInfoPattern = /^((?:(?:Class|Package) \S+)|LaTeX|LaTeX Font) (Warning|Info):\s+(.*?)(?: on input line (\d+))?\.$/
const incompleteFontPattern = /^LaTeX Font .*[^.]$/

export default class LogParser {
  constructor (filePath) {
    this.filePath = filePath
    this.projectPath = path.dirname(filePath)
  }

  parse () {
    const showBuildWarning = atom.config.get('latex.showBuildWarning') !== false
    const showBuildInfo = atom.config.get('latex.showBuildInfo') !== false
    const result = {
      logFilePath: this.filePath,
      outputFilePath: null,
      messages: []
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
        result.messages.push({
          type: 'Error',
          logPosition: [index, 0],
          filePath: match[1],
          lineNumber: parseInt(match[2], 10),
          message: (match[3] && match[3] !== 'LaTeX') ? match[3] + ': ' + match[4] : match[4]
        })
        return
      }

      if (showBuildWarning) {
        match = line.match(boxPattern)
        if (match) {
          result.messages.push({
            type: 'Warning',
            logPosition: [index, 0],
            lineNumber: parseInt(match[2], 10),
            endLineNumber: parseInt(match[3], 10),
            message: match[1]
          })
          return
        }
      }

      if (showBuildWarning || showBuildInfo) {
        match = (incompleteFontPattern.test(line) ? line + lines[index + 1].substring(15) : line).match(warningInfoPattern)
        console.log(match)
        if (match && ((showBuildWarning && match[2] === 'Warning') || (showBuildInfo && match[2] === 'Info'))) {
          console.log(match)
          let message = {
            logPosition: [index, 0],
            message: ((match[1] !== 'LaTeX') ? match[1] + ': ' + match[3] : match[3]).replace(/\s+/g, ' '),
            type: match[2]
          }
          if (match[4]) {
            message.lineNumber = parseInt(match[4], 10)
          }
          result.messages.push(message)
          return
        }
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
}
