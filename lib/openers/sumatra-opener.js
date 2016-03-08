'use babel'

import child_process from 'child_process'
import Opener from '../opener'

export default class SumatraOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const sumatraPath = `"${atom.config.get('latex.sumatraPath')}"`
    const atomPath = `"${process.argv[0]}"`
    const args = [
      '-reuse-instance',
      '-forward-search',
      `"${texPath}"`,
      `"${lineNumber}"`,
      `"${filePath}"`,
      '-inverse-search',
      ['\"\\\"', `${atomPath}`, '\\\"'].join(''),
      '\\\"%f:%l\\\"'
    ]

    const command = `${sumatraPath} ${args.join(' ')}`

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
