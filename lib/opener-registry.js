/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'

export default class OpenerRegistry {
  constructor () {
    this.createOpeners()
  }

  async createOpeners () {
    const moduleDir = path.join(__dirname, 'openers')
    const entries = fs.readdirSync(moduleDir)
    this.openers = entries.map(entry => {
      const OpenerImpl = require(path.join(moduleDir, entry))
      return new OpenerImpl()
    })
    // Sort the openers into decreasing priority
    this.openers = _.orderBy(this.openers, [opener => opener.hasSynctex(), opener => opener.canOpenInBackground()], ['desc', 'desc'])
  }

  async open (filePath, texPath, lineNumber) {
    const name = atom.config.get('latex.opener')
    const openResultInBackground = atom.config.get('latex.openResultInBackground')
    const enableSynctex = atom.config.get('latex.enableSynctex')

    let openers = _.filter(this.openers, opener => opener.canOpen(filePath))

    if (!openers.length) {
      latex.log.warning(`No opener found that can open ${filePath}.`)
      return
    }

    let opener

    if (name !== 'automatic') {
      opener = _.find(openers, opener => opener.getName() === name)
    }

    if (!opener && enableSynctex) {
      // If the user wants openResultInBackground also and there is an opener
      // that supports that and SyncTeX it will be the first one because of
      // the priority sort.
      opener = _.find(openers, opener => opener.hasSynctex())
    }

    if (!opener && openResultInBackground) {
      opener = _.find(openers, opener => opener.canOpenInBackground())
    }

    if (!opener) opener = openers[0]

    return await opener.open(filePath, texPath, lineNumber)
  }
}
