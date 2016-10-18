/** @babel */

import _ from 'lodash'
import path from 'path'

export default class OpenerRegistry {
  openers = new Map()

  async initializeOpeners () {
    const schema = atom.config.getSchema('latex.opener')
    const dir = path.join(__dirname, 'openers')
    const ext = '.js'
    for (const openerName of schema.enum) {
      if (openerName !== 'automatic') {
        const name = `${openerName}-opener`
        const OpenerImpl = require(path.format({ dir, name, ext }))
        this.openers.set(openerName, new OpenerImpl())
      }
    }
  }

  async open (filePath, texPath, lineNumber) {
    const name = atom.config.get('latex.opener')
    let opener = this.openers.get(name)

    if (!opener || !opener.canOpen(filePath)) {
      opener = this.findOpener(filePath)
    }

    if (opener) {
      return await opener.open(filePath, texPath, lineNumber)
    } else {
      latex.log.warning(`No opener found that can open ${filePath}.`)
    }
  }

  findOpener (filePath) {
    const openResultInBackground = atom.config.get('latex.openResultInBackground')
    const enableSynctex = atom.config.get('latex.enableSynctex')
    const candidates = Array.from(this.openers.values()).filter(opener => opener.canOpen(filePath))

    if (!candidates.length) return

    const rankedCandidates = _.orderBy(candidates,
      [opener => opener.hasSynctex(), opener => opener.canOpenInBackground()],
      ['desc', 'desc'])

    if (enableSynctex) {
      // If the user wants openResultInBackground also and there is an opener
      // that supports that and SyncTeX it will be the first one because of
      // the priority sort.
      const opener = rankedCandidates.find(opener => opener.hasSynctex())
      if (opener) return opener
    }

    if (openResultInBackground) {
      const opener = rankedCandidates.find(opener => opener.canOpenInBackground())
      if (opener) return opener
    }

    return rankedCandidates[0]
  }
}
