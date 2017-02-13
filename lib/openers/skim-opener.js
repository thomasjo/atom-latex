/* @flow */

import fs from 'fs-plus'
// $FlowIgnore
import { heredoc } from '../werkzeug'
import Opener from '../opener'

export default class SkimOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const skimPath: string = atom.config.get('latex.skimPath')
    const shouldActivate: boolean = !this.shouldOpenInBackground()
    const command: string = heredoc(`
      osascript -e \
      "
      set theLine to \\"${lineNumber}\\" as integer
      set theFile to POSIX file \\"${filePath}\\"
      set theSource to POSIX file \\"${texPath}\\"
      set thePath to POSIX path of (theFile as alias)
      tell application \\"${skimPath}\\"
        if ${shouldActivate.toString()} then activate
        try
          set theDocs to get documents whose path is thePath
          if (count of theDocs) > 0 then revert theDocs
        end try
        open theFile
        tell front document to go to TeX line theLine from theSource
      end tell
      "
      `)

    await latex.process.executeChildProcess(command, { showError: true })
  }

  canOpen (filePath: string): boolean {
    return process.platform === 'darwin' && fs.existsSync(atom.config.get('latex.skimPath'))
  }

  hasSynctex (): boolean {
    return true
  }

  canOpenInBackground (): boolean {
    return true
  }
}
