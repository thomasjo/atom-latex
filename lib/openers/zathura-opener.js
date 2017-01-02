/* @flow */

import fs from 'fs-plus'
import Opener from '../opener'
// $FlowIgnore
import { isPdfFile, isPsFile } from '../werkzeug'

export default class ZathuraOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const zathuraPath: string = atom.config.get('latex.zathuraPath')
    const atomPath: string = process.argv[0]
    const args: Array<string> = [
      `--synctex-editor-command="\\"${atomPath}\\" \\"%{input}:%{line}\\""`,
      `--synctex-forward="${lineNumber}:1:${texPath}"`,
      `"${filePath}"`
    ]
    const command: string = `"${zathuraPath}" ${args.join(' ')}`
    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string): boolean {
    return process.platform === 'linux' &&
      (isPdfFile(filePath) || isPsFile(filePath)) &&
      fs.existsSync(atom.config.get('latex.zathuraPath'))
  }

  hasSynctex (): boolean {
    return true
  }
}
