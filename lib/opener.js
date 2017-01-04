/** @babel */

import RuntimeComponent from './runtime-component'

export default class Opener extends RuntimeComponent {
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
