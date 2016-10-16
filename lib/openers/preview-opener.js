/** @babel */

import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class PreviewOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    let command = `open -g -a Preview.app "${filePath}"`
    if (!this.shouldOpenInBackground()) {
      command = command.replace(/\-g\s/, '')
    }

    return this.executeChildProcess(command)
  }

  canOpen (filePath) {
    return process.platform === 'darwin' && (isPdfFile(filePath) || isPsFile(filePath))
  }

  canOpenInBackground () {
    return true
  }

  getName () {
    return 'preview'
  }
}
