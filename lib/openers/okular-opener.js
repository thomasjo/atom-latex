'use babel'

import Opener from '../opener'
import child_process from 'child_process'

export default class OkularOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const command = `"${atom.config.get('latex.okularPath')}" --unique "${filePath}#src:${lineNumber} ${texPath}"`

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
