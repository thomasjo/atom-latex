import fs from 'fs'
import { pathToUri } from '../werkzeug'
import Opener from '../opener'

export default class OkularOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number) {
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

  canOpen (filePath: string) {
    return process.platform === 'linux' && fs.existsSync(atom.config.get('latex.okularPath'))
  }

  hasSynctex () {
    return true
  }

  canOpenInBackground () {
    return true
  }
}
