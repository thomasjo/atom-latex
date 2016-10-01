/** @babel */

import Opener from '../opener'

export default class CustomOpener extends Opener {
  // Custom PDF viewer does not support texPath and lineNumber.
  async open (filePath, texPath, lineNumber) {
    const command = `"${atom.config.get('latex.viewerPath')}" "${filePath}"`

    return this.executeChildProcess(command)
  }
}
