/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import { heredoc } from './werkzeug'

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
  }

  async open (filePath, texPath, lineNumber) {
    let openers = []

    for (const opener of this.openers) {
      if (opener.canOpen(filePath)) {
        openers.push(opener)
      }
    }

    openers = _.orderBy(openers, [opener => opener.hasSynctex(), opener => opener.canOpenInBackground()], ['desc', 'desc'])

    if (!openers.length) {
      latex.log.warning(heredoc(`
        No PDF opener found.
        For cross-platform viewing, consider installing the pdf-view package.
        `)
      )
      return
    }

    let opener

    const name = atom.config.get('latex.opener')
    if (name !== 'automatic') {
      opener = _.find(openers, opener => opener.getName() === name)
    }

    if (!opener) opener = openers[0]
    console.log(opener)
    return await opener.open(filePath, texPath, lineNumber)
  }
}
