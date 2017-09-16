/** @babel */

import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

export default class PdfViewOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const texPane = atom.workspace.paneForURI(texPath)
    const previousActivePane = atom.workspace.getActivePane()

    // This prevents splitting the right pane multiple times
    if (texPane) {
      texPane.activate()
    }

    const options = {
      searchAllPanes: true,
      split: atom.config.get('latex.pdfViewSplitDirection')
    }

    const item = await atom.workspace.open(filePath, options)
    if (item && item.forwardSync) {
      item.forwardSync(texPath, lineNumber)
    }

    if (previousActivePane && this.shouldOpenInBackground()) {
      previousActivePane.activate()
    }

    return true
  }

  canOpen (filePath) {
    return isPdfFile(filePath) && atom.packages.isPackageActive('pdf-view')
  }
}
