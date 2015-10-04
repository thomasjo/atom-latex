'use babel'

import Opener from '../opener'

export default class AtomPdfOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    // Opens PDF in a new pane -- requires pdf-view module
    const openPanes = atom.workspace.getPaneItems()
    for (const openPane of openPanes) {
      // File is already open in another pane
      if (openPane.filePath === filePath) { return }
    }

    const pane = atom.workspace.getActivePane()
    // TODO: Make this configurable?
    // FIXME: Migrate to Pane::splitRight.
    const newPane = pane.split('horizontal', 'after')
    // FIXME: Use public API instead.
    atom.workspace.openURIInPane(filePath, newPane)

    // TODO: Check for actual success?
    if (callback) {
      callback(0)
    }
  }
}
