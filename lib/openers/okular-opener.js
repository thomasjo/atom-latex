/** @babel */

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
}
