import fs from 'fs'
import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

export default class SumatraOpener extends Opener {
  hasSynctex () {
    return true
  }

  canOpen (filePath: string) {
    const supportedFile = isPdfFile(filePath)
    const binaryExists = fs.existsSync(atom.config.get('latex.sumatraPath'))
    return process.platform === 'win32' && supportedFile && binaryExists
  }

  async open (filePath: string, texPath: string, lineNumber: number) {
    const atomPath = process.argv[0]
    const args = [
      '-reuse-instance',
      '-forward-search',
      `"${texPath}"`,
      lineNumber,
      '-inverse-search',
      `"\\"${atomPath}\\" \\"%f:%l\\""`,
      `"${filePath}"`
    ]

    const sumatraPath = `"${atom.config.get('latex.sumatraPath')}"`
    const command = `${sumatraPath} ${args.join(' ')}`
    await latex.process.executeChildProcess(command)
  }
}
