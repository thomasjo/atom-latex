'use babel'

import child_process from 'child_process'
import Opener from '../opener'

export default class PreviewOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    // TODO: Nuke this?
    if (typeof texPath === 'function') {
      callback = texPath
    }

    let command = `open -g -a Preview.app "${filePath}"`
    if (!this.shouldOpenInBackground()) {
      command = command.replace(/\-g\s/, '')
    }

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
