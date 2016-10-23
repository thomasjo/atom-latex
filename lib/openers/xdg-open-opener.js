/** @babel */

import Opener from '../opener'

export default class XdgOpenOpener extends Opener {
  // xdg-open does not support texPath and lineNumber.
  async open (filePath, texPath, lineNumber) {
    const command = `xdg-open "${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return process.platform === 'linux'
  }
}
