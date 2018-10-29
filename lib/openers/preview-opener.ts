import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class PreviewOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number) {
    let command = `open -g -a Preview.app "${filePath}"`
    if (!this.shouldOpenInBackground()) {
      command = command.replace(/-g\s/, '')
    }

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string) {
    return process.platform === 'darwin' && (isPdfFile(filePath) || isPsFile(filePath))
  }

  canOpenInBackground () {
    return true
  }
}
