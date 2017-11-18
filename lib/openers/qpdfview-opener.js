/** @babel */

import fs from 'fs-plus'
import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class QpdfviewOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const qpdfviewPath = atom.config.get('latex.qpdfviewPath')
    const args = [
      `--unique`,
      `"${filePath}"#src:"${texPath}":${lineNumber}:0`
    ]
    const command = `"${qpdfviewPath}" ${args.join(' ')}`
    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return process.platform === 'linux' &&
      (isPdfFile(filePath) || isPsFile(filePath)) &&
      fs.existsSync(atom.config.get('latex.qpdfviewPath'))
  }

  hasSynctex () {
    return true
  }
}
