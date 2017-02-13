/* @flow */

export default class Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {}

  shouldOpenInBackground (): boolean {
    return atom.config.get('latex.openResultInBackground')
  }

  canOpen (filePath: string): boolean {
    return false
  }

  hasSynctex (): boolean {
    return false
  }

  canOpenInBackground (): boolean {
    return false
  }
}
