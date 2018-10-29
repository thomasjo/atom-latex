import { Disposable } from 'atom'

export default abstract class Opener extends Disposable {
  async abstract open (filePath: string, texPath: string, lineNumber: number): Promise<void>

  shouldOpenInBackground () {
    return atom.config.get('latex.openResultInBackground')
  }

  canOpen (filePath: string) {
    return false
  }

  hasSynctex () {
    return false
  }

  canOpenInBackground () {
    return false
  }
}
