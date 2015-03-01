Opener = require '../opener'

module.exports =
class AtomPdfOpener extends Opener
  open: (filePath, texPath, lineNumber, callback) ->
    # Opens PDF in a new pane -- requires pdf-view module
    openPanes = atom.workspace.getPaneItems()
    for pane in openPanes
      # File is already open in another pane
      return if pane.filePath is filePath
    pane = atom.workspace.getActivePane()
    newPane = pane.split('horizontal', 'after') # TODO: Make this configurable?
    atom.workspace.openURIInPane(filePath, newPane)
