child_process = require 'child_process'
Opener = require "../opener"

module.exports =
class SkimOpener extends Opener
  open: (filePath, callback) ->
    skimPath = atom.config.get('latex.skimPath')
    shouldActivate = not @shouldOpenInBackground()
    command =
      """
      osascript -e \
      "
      set theFile to POSIX file \\\"#{filePath}\\\"
      set thePath to POSIX path of (theFile as alias)
      tell application \\\"#{skimPath}\\\"
        if #{shouldActivate} then activate
        try
          set theDocs to get documents whose path is thePath
          if (count of theDocs) > 0 then revert theDocs
        end try
        open theFile
      end tell
      "
      """
    child_process.exec command, (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?

  sync: (filePath, texPath, lineNumber, callback) ->
    skimPath = atom.config.get('latex.skimPath')
    shouldActivate = not @shouldOpenInBackground()
    command =
      """
      osascript -e \
      "
      set theLine to \\\"#{lineNumber}\\\" as integer
      set theFile to POSIX file \\\"#{filePath}\\\"
      set theSource to POSIX file \\\"#{texPath}\\\"
      set thePath to POSIX path of (theFile as alias)
      tell application \\\"#{skimPath}\\\"
        if #{shouldActivate} then activate
        try
          set theDocs to get documents whose path is thePath
          if (count of theDocs) > 0 then revert theDocs
        end try
        open theFile
        tell front document to go to TeX line theLine from theSource
      end tell
      "
      """
    child_process.exec command, (error, stdout, stderr) ->
      exitCode = error?.code ? 0
      callback(exitCode) if callback?
