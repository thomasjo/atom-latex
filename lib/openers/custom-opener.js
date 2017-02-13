/* @flow */

import fs from 'fs-plus'
import Opener from '../opener'
// $FlowIgnore
import { isPdfFile } from '../werkzeug'

export default class CustomOpener extends Opener {
  // Custom PDF viewer does not support texPath and lineNumber.
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const command: string = `"${atom.config.get('latex.viewerPath')}" "${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string): boolean {
    return isPdfFile(filePath) && fs.existsSync(atom.config.get('latex.viewerPath'))
  }
}
