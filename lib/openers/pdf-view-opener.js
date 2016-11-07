/** @babel */

import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

function forwardSync (pdfView, texPath, lineNumber) {
  if (pdfView != null && pdfView.forwardSync != null) {
    pdfView.forwardSync(texPath, lineNumber)
  }
}

export default class PdfViewOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const openPaneItems = atom.workspace.getPaneItems()
    for (const openPaneItem of openPaneItems) {
      if (openPaneItem.filePath === filePath) {
        forwardSync(openPaneItem, texPath, lineNumber)
        return true
      }
    }

    // TODO: Make this configurable?
    atom.workspace.open(filePath, {'split': 'right'}).then(pane => forwardSync(pane, texPath, lineNumber))

    return true
  }

  canOpen (filePath) {
    return isPdfFile(filePath) && atom.packages.isPackageActive('pdf-view')
  }
}
