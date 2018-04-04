/** @babel */

import fs from 'fs-plus'
import { pathToUri } from '../werkzeug'
import Opener from '../opener'

export default class OkularOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const okularPath = atom.config.get('latex.okularPath')
    const uri = pathToUri(filePath, `src:${lineNumber} ${texPath}`)
    const args = [
      '--unique',
      `"${uri}"`
    ]
    if (this.shouldOpenInBackground()) args.unshift('--noraise')

    const command = `"${okularPath}" ${args.join(' ')}`

    await latex.process.executeChildProcess(command, { showError: true })
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
}
