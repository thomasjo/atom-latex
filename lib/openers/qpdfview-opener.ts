import fs from 'fs'
import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class QpdfviewOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number) {
    const qpdfviewPath = atom.config.get('latex.qpdfviewPath')
    const args = [
      `--unique`,
      `"${filePath}"#src:"${texPath}":${lineNumber}:0`
    ]
    const command = `"${qpdfviewPath}" ${args.join(' ')}`
    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string) {
    return process.platform === 'linux' &&
      (isPdfFile(filePath) || isPsFile(filePath)) &&
      fs.existsSync(atom.config.get('latex.qpdfviewPath'))
  }

  hasSynctex () {
    return true
  }
}
