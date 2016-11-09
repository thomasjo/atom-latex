/** @babel */

import Opener from '../opener'

export default class ShellOpenOpener extends Opener {
  // shell open does not support texPath and lineNumber.
  async open (filePath, texPath, lineNumber) {
    const command = `"${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return process.platform === 'win32'
  }
}
