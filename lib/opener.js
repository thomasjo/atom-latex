/** @babel */

import { Disposable } from 'atom'

export default class Opener extends Disposable {
  async open (filePath, texPath, lineNumber) {}

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
}
