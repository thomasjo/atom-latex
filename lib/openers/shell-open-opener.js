/* @flow */

import Opener from '../opener'

export default class ShellOpenOpener extends Opener {
  // shell open does not support texPath and lineNumber.
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const command: string = `"${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string): boolean {
    return process.platform === 'win32'
  }
}
