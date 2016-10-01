/** @babel */

import Opener from '../opener'

export default class SumatraOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const sumatraPath = `"${atom.config.get('latex.sumatraPath')}"`
    const atomPath = `"${process.argv[0]}"`
    const args = [
      '-reuse-instance',
      '-forward-search',
      `"${texPath}"`,
      `"${lineNumber}"`,
      `"${filePath}"`,
      '-inverse-search',
      ['"\\"', `${atomPath}`, '\\"'].join(''),
      '\\"%f:%l\\"'
    ]

    const command = `${sumatraPath} ${args.join(' ')}`

    return this.executeChildProcess(command)
  }
}
