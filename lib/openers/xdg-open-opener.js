/** @babel */

import Opener from '../opener'

export default class XdgOpenOpener extends Opener {
  executable = 'xdg-open'

  async checkAvailability () {
    if (process.platform === 'linux') {
      const { statusCode } = await latex.process.executeChildProcess(`${this.executable} --version`)
      this.setAvailability(statusCode === 0)
    }
  }
  // xdg-open does not support texPath and lineNumber.
  async open (filePath, texPath, lineNumber) {
    const command = `${this.executable} "${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return this.isAvailable()
  }
}
