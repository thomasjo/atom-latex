'use babel'

import child_process from 'child_process'
import Opener from '../opener'

export default class SumatraOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const command = `"${atom.config.get('latex.sumatraPath')}" -forward-search "${texPath}" "${lineNumber}" "${filePath}"`

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
