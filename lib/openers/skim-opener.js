'use babel'

import child_process from 'child_process'
import {heredoc} from '../werkzeug'
import Opener from '../opener'

export default class SkimOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    const skimPath = atom.config.get('latex.skimPath')
    const shouldActivate = !this.shouldOpenInBackground()
    const command = heredoc(`
      osascript -e \
      "
      set theLine to \\\"${lineNumber}\\\" as integer
      set theFile to POSIX file \\\"${filePath}\\\"
      set theSource to POSIX file \\\"${texPath}\\\"
      set thePath to POSIX path of (theFile as alias)
      tell application \\\"${skimPath}\\\"
        if ${shouldActivate} then activate
        try
          set theDocs to get documents whose path is thePath
          if (count of theDocs) > 0 then revert theDocs
        end try
        open theFile
        tell front document to go to TeX line theLine from theSource
      end tell
      "
      `)

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0)
      }
    })
  }
}
