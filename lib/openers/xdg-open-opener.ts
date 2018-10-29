import Opener from '../opener'

export default class XdgOpenOpener extends Opener {
  // xdg-open does not support texPath and lineNumber.
  async open (filePath: string, texPath: string, lineNumber: number) {
    const command = `xdg-open "${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string) {
    return process.platform === 'linux'
  }
}
