/* @flow */

import Opener from '../opener'
// $FlowIgnore
import { isPdfFile } from '../werkzeug'

function forwardSync (pdfView, texPath, lineNumber) {
  if (pdfView != null && pdfView.forwardSync != null) {
    pdfView.forwardSync(texPath, lineNumber)
  }
}

export default class PdfViewOpener extends Opener {
  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const openPaneItems = atom.workspace.getPaneItems()
    for (const openPaneItem of openPaneItems) {
      if (openPaneItem.filePath === filePath) {
        forwardSync(openPaneItem, texPath, lineNumber)
      }
    }

    // TODO: Make this configurable?
    atom.workspace.open(filePath, {'split': 'right'}).then(pane => forwardSync(pane, texPath, lineNumber))
  }

  canOpen (filePath: string): boolean {
    return isPdfFile(filePath) && atom.packages.isPackageActive('pdf-view')
  }
}
