'use babel'

import Opener from '../opener'

export default class AtomPdfOpener extends Opener {
  open (filePath, texPath, lineNumber, callback) {
    // Opens PDF in a new pane -- requires pdf-view module

    function forwardSync(pdfView) {
      if (pdfView != null && pdfView.forwardSync != null) {
        pdfView.forwardSync(texPath, lineNumber)
      }
    }

    const openPaneItems = atom.workspace.getPaneItems()
    for (const openPaneItem of openPaneItems) {
      // File is already open in another pane
      if (openPaneItem.filePath === filePath) {
        forwardSync(openPaneItem)
        return
      }
    }

    const activePane = atom.workspace.getActivePane()
    // TODO: Make this configurable?
    atom.workspace.open(filePath, {'split': 'right'}).done(function (pdfView) {
      forwardSync(pdfView)
    })

    // TODO: Check for actual success?
    if (callback) {
      callback(0)
    }
  }
}
