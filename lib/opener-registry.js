/* @flow */

import _ from 'lodash'
import path from 'path'
import { CompositeDisposable, Disposable } from 'atom'
import Opener from './opener'

export default class OpenerRegistry {
  openers: Map<string, Opener> = new Map()
  disposables: CompositeDisposable = new CompositeDisposable()

  constructor (): void {
    this.initializeOpeners()
  }

  dispose (): void {
    this.disposables.dispose()
  }

  initializeOpeners (): void {
    const schema: Object = atom.config.getSchema('latex.opener')
    const dir: string = path.join(__dirname, 'openers')
    const ext: string = '.js'
    for (const openerName: string of schema.enum) {
      if (openerName !== 'automatic') {
        const name: string = `${openerName}-opener`
        const OpenerImpl: Class<Opener> = require(path.format({ dir, name, ext }))
        const opener: Opener = new OpenerImpl()
        if (Disposable.isDisposable(opener)) {
          this.disposables.add(opener)
        }
        this.openers.set(openerName, opener)
      }
    }
  }

  checkRuntimeDependencies (): void {
    const pdfOpeners: Array<string> = Array.from(this.getCandidateOpeners('foo.pdf').keys())
    if (pdfOpeners.length) {
      latex.log.info(`The following PDF capable openers were found: ${pdfOpeners.join(', ')}.`)
    } else {
      latex.log.error('No PDF capable openers were found.')
    }

    const psOpeners: Array<string> = Array.from(this.getCandidateOpeners('foo.ps').keys())
    if (psOpeners.length) {
      latex.log.info(`The following PS capable openers were found: ${psOpeners.join(', ')}.`)
    } else {
      latex.log.warning('No PS capable openers were found.')
    }

    const dviOpeners: Array<string> = Array.from(this.getCandidateOpeners('foo.dvi').keys())
    if (dviOpeners.length) {
      latex.log.info(`The following DVI capable openers were found: ${dviOpeners.join(', ')}.`)
    } else {
      latex.log.warning('No DVI capable openers were found.')
    }
  }

  async open (filePath: string, texPath: string, lineNumber: number): Promise<void> {
    const name: string = atom.config.get('latex.opener')
    let opener: ?Opener = this.openers.get(name)

    if (!opener || !opener.canOpen(filePath)) {
      opener = this.findOpener(filePath)
    }

    if (opener) {
      return await opener.open(filePath, texPath, lineNumber)
    } else {
      latex.log.warning(`No opener found that can open ${filePath}.`)
    }
  }

  getCandidateOpeners (filePath: string): Map<string, Opener> {
    const candidates: Map<string, Opener> = new Map()
    for (const [name, opener]: [string, Opener] of this.openers.entries()) {
      if (opener.canOpen(filePath)) candidates.set(name, opener)
    }
    return candidates
  }

  findOpener (filePath: string): ?Opener {
    const openResultInBackground: boolean = atom.config.get('latex.openResultInBackground')
    const enableSynctex: boolean = atom.config.get('latex.enableSynctex')
    const candidates: Array<Opener> = Array.from(this.getCandidateOpeners(filePath).values())

    if (!candidates.length) return

    const rankedCandidates: Array<Opener> = _.orderBy(candidates,
      [(opener: Opener): boolean => opener.hasSynctex(), (opener: Opener): boolean => opener.canOpenInBackground()],
      ['desc', 'desc'])

    if (enableSynctex) {
      // If the user wants openResultInBackground also and there is an opener
      // that supports that and SyncTeX it will be the first one because of
      // the priority sort.
      const opener: ?Opener = rankedCandidates.find(opener => opener.hasSynctex())
      if (opener) return opener
    }

    if (openResultInBackground) {
      const opener: ?Opener = rankedCandidates.find(opener => opener.canOpenInBackground())
      if (opener) return opener
    }

    return rankedCandidates[0]
  }
}
