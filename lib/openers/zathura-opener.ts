/// <reference types="atom" />

import fs from 'fs'
import Opener from '../opener'
import { isPdfFile, isPsFile } from '../werkzeug'

export default class ZathuraOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number) {
    const zathuraPath = atom.config.get('latex.zathuraPath')
    const atomPath = process.argv[0]
    const args = [
      `--synctex-editor-command="\\"${atomPath}\\" \\"%{input}:%{line}\\""`,
      `--synctex-forward="${lineNumber}:1:${texPath}"`,
      `"${filePath}"`
    ]
    const command = `"${zathuraPath}" ${args.join(' ')}`
    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string) {
    return process.platform === 'linux' &&
      (isPdfFile(filePath) || isPsFile(filePath)) &&
      fs.existsSync(atom.config.get('latex.zathuraPath'))
  }

  hasSynctex () {
    return true
  }
}
