/** @babel */

import Opener from '../opener'
import { isPdfFile } from '../werkzeug'

function sleep (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export default class PdfViewOpener extends Opener {
  async open (filePath, texPath, lineNumber) {
    const texPane = atom.workspace.paneForURI(texPath)

    // This prevents splitting the right pane multiple times
    if (texPane) {
      texPane.activate()
    }

    const options = {
      searchAllPanes: true,
      split: atom.config.get('latex.openerSplit')
    }

    const item = await atom.workspace.open(filePath, options)
    const pane = atom.workspace.paneForItem(item)
    if (pane && item && item.forwardSync) {
      item.forwardSync(texPath, lineNumber)
      // If we don't wait for pdf-view to do it's first update then it will just
      // display a blank page when there are multiple jobs.
      while (item.updating) {
        await sleep(100)
      }
    }

    return true
  }

  canOpen (filePath) {
    return isPdfFile(filePath) && atom.packages.isPackageActive('pdf-view')
  }
}
