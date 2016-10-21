/** @babel */

import fs from 'fs-plus'
import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

export default class SumatraOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const sumatraPath = `"${atom.config.get('latex.sumatraPath')}"`
    const atomPath = `"${process.argv[0]}"`
    const args = [
      '-forward-search',
      `"${texPath}"`,
      lineNumber,
      '-inverse-search',
      `"\\"${atomPath}\\" \\"%f:%l\\""`,
      `"${filePath}"`
    ]

    const command = `${sumatraPath} ${args.join(' ')}`

    await latex.process.executeChildProcess(command)
  }

  canOpen (filePath) {
    return process.platform === 'win32' && isPdfFile(filePath) &&
      fs.existsSync(atom.config.get('latex.sumatraPath'))
  }

  hasSynctex () {
    return true
  }
}
