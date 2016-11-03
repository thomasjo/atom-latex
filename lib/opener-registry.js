/** @babel */

import _ from 'lodash'
import path from 'path'
import { CompositeDisposable, Disposable } from 'atom'

export default class OpenerRegistry extends Disposable {
  openers = new Map()
  disposables = new CompositeDisposable()

  constructor () {
    super(() => this.disposables.dispose())
    this.initializeOpeners()
  }

  initializeOpeners () {
    const schema = atom.config.getSchema('latex.opener')
    const dir = path.join(__dirname, 'openers')
    const ext = '.js'
    for (const openerName of schema.enum) {
      if (openerName !== 'automatic') {
        const name = `${openerName}-opener`
        const OpenerImpl = require(path.format({ dir, name, ext }))
        const opener = new OpenerImpl()
        this.disposables.add(opener)
        this.openers.set(openerName, opener)
      }
    }
  }

  async checkRuntimeDependencies () {
    const pdfOpeners = await this.getCandidateOpeners('foo.pdf')
    if (pdfOpeners.size) {
      latex.log.info(`The following PDF capable openers were found: ${Array.from(pdfOpeners.keys()).join(', ')}.`)
    } else {
      latex.log.error('No PDF capable openers were found.')
    }

    const psOpeners = await this.getCandidateOpeners('foo.ps')
    if (psOpeners.size) {
      latex.log.info(`The following PS capable openers were found: ${Array.from(psOpeners.keys()).join(', ')}.`)
    } else {
      latex.log.warning('No PS capable openers were found.')
    }

    const dviOpeners = await this.getCandidateOpeners('foo.dvi')
    if (dviOpeners.size) {
      latex.log.info(`The following DVI capable openers were found: ${Array.from(dviOpeners.keys()).join(', ')}.`)
    } else {
      latex.log.warning('No DVI capable openers were found.')
    }
  }

  async open (filePath, texPath, lineNumber) {
    const name = atom.config.get('latex.opener')
    let opener = this.openers.get(name)

    if (!opener || !await opener.canOpen(filePath)) {
      opener = await this.findOpener(filePath)
    }

    if (opener) {
      return await opener.open(filePath, texPath, lineNumber)
    } else {
      latex.log.warning(`No opener found that can open ${filePath}.`)
    }
  }

  async getCandidateOpeners (filePath) {
    const candidates = new Map()
    for (const [name, opener] of this.openers.entries()) {
      if (await opener.canOpen(filePath)) candidates.set(name, opener)
    }
    return candidates
  }

  async findOpener (filePath) {
    const openResultInBackground = atom.config.get('latex.openResultInBackground')
    const enableSynctex = atom.config.get('latex.enableSynctex')
    const candidates = await this.getCandidateOpeners(filePath)

    if (!candidates.size) return

    const rankedCandidates = _.orderBy(Array.from(candidates.values()),
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
