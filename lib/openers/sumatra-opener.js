/** @babel */

import path from 'path'
import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

export default class SumatraOpener extends Opener {
  executable = 'SumatraPDF'

  async checkAvailability () {
    if (process.platform === 'win32') {
      const { statusCode } = latex.process.executeChildProcess(`${this.executable} -exit-when-done`)
      this.setAvailability(statusCode === 0)
    }
  }

  getPossiblePaths () {
    if (process.platform === 'win32') {
      return [
        path.join(process.env.ProgramW6432, 'SumatraPDF'),
        path.join(process.env['ProgramFiles(x86)'], 'SumatraPDF')
      ]
    }

    return []
  }

  async open (filePath, texPath, lineNumber) {
    const atomPath = `"${process.argv[0]}"`
    const args = [
      '-forward-search',
      `"${texPath}"`,
      lineNumber,
      '-inverse-search',
      `"\\"${atomPath}\\" \\"%f:%l\\""`,
      `"${filePath}"`
    ]

    const command = `${this.executable} ${args.join(' ')}`

    await latex.process.executeChildProcess(command)
  }

  canOpen (filePath) {
    return this.isAvailable() && isPdfFile(filePath)
  }

  hasSynctex () {
    return true
  }
}
