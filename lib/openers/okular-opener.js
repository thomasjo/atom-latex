/** @babel */

import Opener from '../opener'

export default class OkularOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const okularPath = atom.config.get('latex.okularPath')
    const args = [
      '--unique',
      `"${filePath}#src:${lineNumber} ${texPath}"`
    ]

    const command = `"${okularPath}" ${args.join(' ')}`

    return this.executeChildProcess(command)
  }
}
