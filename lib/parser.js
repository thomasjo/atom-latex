/* @flow */

import fs from 'fs-plus'

export default class Parser {
  filePath: string

  constructor (filePath: string) {
    this.filePath = filePath
  }

  parse (): ?Object {}

  getLines (defaultLines: ?Array<string>): Array<string> {
    if (!fs.existsSync(this.filePath)) {
      if (defaultLines) return defaultLines
      throw new Error(`No such file: ${this.filePath}`)
    }

    const rawFile = fs.readFileSync(this.filePath, {encoding: 'utf-8'})
    const lines = rawFile.replace(/(\r\n)|\r/g, '\n').split('\n')
    return lines
  }
}
