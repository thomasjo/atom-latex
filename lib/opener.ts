import { Disposable } from 'atom'

export default abstract class Opener extends Disposable {
  shouldOpenInBackground () {
    return atom.config.get('latex.openResultInBackground')
  }

  hasSynctex () {
    return false
  }

  canOpenInBackground () {
    return false
  }

  abstract canOpen (filePath: string): boolean
  abstract async open (filePath: string, texPath: string, lineNumber: number): Promise<void>
}
