/** @babel */

import _ from 'lodash'
import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class ZathuraOpener extends Opener {
  executable = 'zathura'

  async initialize () {
    this.exists = false
    try {
      if (process.platform === 'linux') {
        const { statusCode } = await latex.process.executeChildProcess(`${this.executable} -v`)
        this.exists = statusCode === 0
      }
    } catch (e) {}
  }

  async open (filePath, texPath, lineNumber) {
    const atomPath = process.argv[0]
    const args = [
      `--synctex-editor-command="\\"${atomPath}\\" \\"%{input}:%{line}\\""`,
      `--synctex-forward="${lineNumber}:1:${texPath}"`,
      `"${filePath}"`
    ]
    const command = `${this.executable} ${args.join(' ')}`
    await latex.process.executeChildProcess(command, { showError: true })
  }

  async canOpen (filePath) {
    if (_.isUndefined(this.exists)) {
      await this.initialize()
    }
    return this.exists && (isPdfFile(filePath) || isPsFile(filePath))
  }

  hasSynctex () {
    return true
  }
}
