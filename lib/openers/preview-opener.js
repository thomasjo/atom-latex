/** @babel */

import Opener from '../opener'

export default class PreviewOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    let command = `open -g -a Preview.app "${filePath}"`
    if (!this.shouldOpenInBackground()) {
      command = command.replace(/\-g\s/, '')
    }

    return this.executeChildProcess(command)
  }
}
