Opener = require '../opener'

module.exports =
class AtomPdfOpener extends Opener
  open: (filePath, texPath, lineNumber, callback) ->
    # Opens PDF in a new pane -- requires pdf-view module
    openPanes = atom.workspace.getPaneItems()
    for pane in openPanes
      if pane.filePath is filePath
        # File is already open in another pane
        return
    pane = atom.workspace.getActivePane()
    newPane = pane.split('horizontal', 'after')
    atom.workspace.openURIInPane(filePath, newPane)
