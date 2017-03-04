/** @babel */

import url from 'url'
import Opener from '../opener'

export default class OkularOpener extends Opener {
  executable = 'okular'

  async checkAvailability () {
    if (process.platform === 'linux') {
      const { statusCode } = await latex.process.executeChildProcess(`${this.executable} -v`)
      this.setAvailability(statusCode === 0)
    }
  }

  async open (filePath, texPath, lineNumber) {
    const uri = url.format({
      protocol: 'file:',
      slashes: true,
      pathname: encodeURI(filePath),
      hash: encodeURI(`src:${lineNumber} ${texPath}`)
    })
    const args = [
      '--unique',
      `"${uri}"`
    ]
    if (this.shouldOpenInBackground()) args.unshift('--noraise')

    const command = `"${this.executable}" ${args.join(' ')}`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath) {
    return this.isAvailable()
  }

  hasSynctex () {
    return true
  }

  canOpenInBackground () {
    return true
  }
}
