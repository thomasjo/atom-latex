import Opener from '../opener'

export default class ShellOpenOpener extends Opener {
  canOpen (_filePath: string) {
    return process.platform === 'win32'
  }

  async open (filePath: string, _texPath: string, _lineNumber: number) {
    const command = `"${filePath}"`
    await latex.process.executeChildProcess(command, { showError: true })
  }
}
