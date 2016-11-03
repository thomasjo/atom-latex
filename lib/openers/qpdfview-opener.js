/** @babel */

import _ from 'lodash'
import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class QPdfViewOpener extends Opener {
  executable = 'qpdfview'

  async initialize () {
    this.exists = false
    try {
      if (process.platform === 'linux') {
        const { statusCode } = await latex.process.executeChildProcess(`${this.executable} --help`)
        this.exists = statusCode === 0
      }
    } catch (e) {}
  }

  async open (filePath, texPath, lineNumber) {
    const args = [
      '--unique',
      `"${filePath}#src:${texPath}:${lineNumber}:0"`
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
