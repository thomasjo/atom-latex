/** @babel */

import fs from 'fs-plus'
import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class ZathuraOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const zathuraPath = atom.config.get('latex.zathuraPath')
    const atomPath = process.argv[0]
    const args = [
      `--synctex-editor-command="\\"${atomPath}\\" \\"%{input}:%{line}\\""`,
      `--synctex-forward="${lineNumber}:1:${texPath}"`,
      `"${filePath}"`
    ]
    const command = `"${zathuraPath}" ${args.join(' ')}`
    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return process.platform === 'linux' &&
      (isPdfFile(filePath) || isPsFile(filePath)) &&
      fs.existsSync(atom.config.get('latex.zathuraPath'))
  }

  hasSynctex () {
    return true
  }
}
