/** @babel */

import fs from 'fs-plus'
import Opener from '../opener'

export default class OkularOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const okularPath = atom.config.get('latex.okularPath')
    const args = [
      '--unique',
      `"${filePath}#src:${lineNumber} ${texPath}"`
    ]
    if (this.shouldOpenInBackground()) args.unshift('--noraise')

    const command = `"${okularPath}" ${args.join(' ')}`

    return this.executeChildProcess(command)
  }

  canOpen (filePath) {
    return process.platform === 'linux' && fs.existsSync(atom.config.get('latex.okularPath'))
  }

  hasSynctex () {
    return true
  }

  canOpenInBackground () {
    return true
  }

  getName () {
    return 'okular'
  }
}
