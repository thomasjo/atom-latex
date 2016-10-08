/** @babel */

import { CompositeDisposable, Disposable } from 'atom'
import { REBUILD_ACTION, CLEAN_ACTION, FULL_CLEAN_ACTION } from './actions'

export default {
  activate () {
    this.bootstrap()
    this.disposables = new CompositeDisposable()

    this.disposables.add(atom.commands.add('atom-workspace', {
      'latex:build': () => this.composer.build(),
      'latex:rebuild': () => this.composer.build(REBUILD_ACTION),
      'latex:clean': () => this.composer.build(CLEAN_ACTION),
      'latex:full-clean': () => this.composer.build(FULL_CLEAN_ACTION),
      'latex:sync': () => this.composer.sync(),
      'latex:kill': () => latex.process.killChildProcesses(),
      'latex:sync-log': () => latex.log.sync(),
      'core:close': () => latex.log.hide(),
      'core:cancel': () => latex.log.hide()
    }))

    this.disposables.add(atom.workspace.observeTextEditors(editor => {
      this.disposables.add(editor.onDidSave(() => {
        // Let's play it safe; only trigger builds for the active editor.
        const activeEditor = atom.workspace.getActiveTextEditor()
        if (editor === activeEditor && atom.config.get('latex.buildOnSave')) {
          this.composer.build()
        }
      }))
    }))
  },

  deactivate () {
    if (this.disposables) {
      this.disposables.dispose()
      delete this.disposables
    }

    if (this.composer) {
      this.composer.destroy()
      delete this.composer
    }

    if (global.latex) {
      delete global.latex
    }
  },

  consumeStatusBar (statusBar) {
    this.bootstrap()
    latex.attachStatusBar(statusBar)
    return new Disposable(() => {
      latex.detachStatusBar()
    })
  },

  bootstrap () {
    if (this.composer && global.latex) { return }

    const Latex = require('./latex')
    const Composer = require('./composer')

    global.latex = new Latex()
    this.composer = new Composer()
  }
}
