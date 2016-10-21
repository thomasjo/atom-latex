/** @babel */

import fs from 'fs-plus'
import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

export default class CustomOpener extends Opener {
  // Custom PDF viewer does not support texPath and lineNumber.
  async open (filePath, texPath, lineNumber) {
    const command = `"${atom.config.get('latex.viewerPath')}" "${filePath}"`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return isPdfFile(filePath) && fs.existsSync(atom.config.get('latex.viewerPath'))
  }
}
