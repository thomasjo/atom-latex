/** @babel */

import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class ZathuraOpener extends Opener {
  executable = 'zathura'

  async checkAvailability () {
    if (process.platform === 'linux') {
      const { statusCode } = await latex.process.executeChildProcess(`${this.executable} -v`)
      this.setAvailability(statusCode === 0)
    }
  }

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
    return this.isAvailable() && (isPdfFile(filePath) || isPsFile(filePath))
  }

  hasSynctex () {
    return true
  }
}
