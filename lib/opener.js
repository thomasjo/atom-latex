/** @babel */

export default class Opener {
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
