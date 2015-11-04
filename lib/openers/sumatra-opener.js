'use babel'

import child_process from 'child_process'
import Opener from '../opener'

export default class SumatraOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const sumatraPath = `"${atom.config.get('latex.sumatraPath')}"`
    const args = [
      '-reuse-instance',
      '-forward-search',
      `"${texPath}"`,
      `"${lineNumber}"`,
      `"${filePath}"`
    ]

    const command = `${sumatraPath} ${args.join(' ')}`

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
