/* @flow */

import fs from 'fs-plus'
import url from 'url'
import Opener from '../opener'

export default class OkularOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const okularPath: string = atom.config.get('latex.okularPath')
    const uri: string = url.format({
      protocol: 'file:',
      slashes: true,
      pathname: encodeURI(filePath),
      hash: encodeURI(`src:${lineNumber} ${texPath}`)
    })
    const args: Array<string> = [
      '--unique',
      `"${uri}"`
    ]
    if (this.shouldOpenInBackground()) args.unshift('--noraise')

    const command: string = `"${okularPath}" ${args.join(' ')}`

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string): boolean {
    return process.platform === 'linux' && fs.existsSync(atom.config.get('latex.okularPath'))
  }

  hasSynctex (): boolean {
    return true
  }

  canOpenInBackground (): boolean {
    return true
  }
}
