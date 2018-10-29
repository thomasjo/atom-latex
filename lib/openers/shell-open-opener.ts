import Opener from '../opener'

export default class ShellOpenOpener extends Opener {
  // shell open does not support texPath and lineNumber.
  async open (filePath: string, texPath: string, lineNumber: number) {
    const command = `"${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string) {
    return process.platform === 'win32'
  }
}
