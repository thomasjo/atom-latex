'use babel'

import childProcess from 'child_process'
import Opener from '../opener'

export default class OkularOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const okularPath = atom.config.get('latex.okularPath')
    const args = [
      '--unique',
      `"${filePath}#src:${lineNumber} ${texPath}"`
    ]

    const command = `"${okularPath}" ${args.join(' ')}`

    childProcess.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
