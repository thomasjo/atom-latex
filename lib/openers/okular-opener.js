'use babel'

import Opener from '../opener'
import childProcess from 'child_process'

export default class OkularOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const command = `"${atom.config.get('latex.okularPath')}" --unique "${filePath}#src:${lineNumber} ${texPath}"`

    childProcess.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
