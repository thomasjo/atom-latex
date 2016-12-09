/* @flow */

import fs from 'fs-plus'
import Opener from '../opener'
// $FlowIgnore
import { isPdfFile } from '../werkzeug'

export default class SumatraOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const sumatraPath = `"${atom.config.get('latex.sumatraPath')}"`
    const atomPath = `"${process.argv[0]}"`
    const args = [
      '-forward-search',
      `"${texPath}"`,
      lineNumber,
      '-inverse-search',
      `"\\"${atomPath}\\" \\"%f:%l\\""`,
      `"${filePath}"`
    ]

    const command = `${sumatraPath} ${args.join(' ')}`

    await latex.process.executeChildProcess(command)
  }

  canOpen (filePath: string): boolean {
    return process.platform === 'win32' && isPdfFile(filePath) &&
      fs.existsSync(atom.config.get('latex.sumatraPath'))
  }

  hasSynctex (): boolean {
    return true
  }
}
