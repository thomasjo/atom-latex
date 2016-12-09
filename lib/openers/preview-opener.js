/* @flow */

import Opener from '../opener'
// $FlowIgnore
import { isPdfFile, isPsFile } from '../werkzeug'

export default class PreviewOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    let command = `open -g -a Preview.app "${filePath}"`
    if (!this.shouldOpenInBackground()) {
      command = command.replace(/-g\s/, '')
    }

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string): boolean {
    return process.platform === 'darwin' && (isPdfFile(filePath) || isPsFile(filePath))
  }

  canOpenInBackground (): boolean {
    return true
  }
}
