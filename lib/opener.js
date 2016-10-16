/** @babel */

import ChildProcess from 'child_process'
import { promisify } from './werkzeug'

const exec = promisify(ChildProcess.exec)

export default class Opener {
  async open (filePath, texPath, lineNumber) {}

  async executeChildProcess (command) {
    try {
      await exec(command)
      return true
    } catch (error) {
      latex.log.error(`An error occured while trying to run opener (${error.code})`)
      return false
    }
  }

  shouldOpenInBackground () {
    return atom.config.get('latex.openResultInBackground')
  }

  canOpen (filePath) {
    return false
  }

  hasSynctex () {
    return false
  }

  canOpenInBackground () {
    return false
  }

  getName () {}
}
