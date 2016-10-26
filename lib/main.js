/** @babel */

import { CompositeDisposable, Disposable } from 'atom'

export default {
  activate () {
    this.bootstrap()
    this.disposables = new CompositeDisposable()

    this.disposables.add(atom.commands.add('atom-workspace', {
      'latex:build': () => composer.build(false),
      'latex:rebuild': () => composer.build(true),
      'latex:clean': () => composer.clean(),
      'latex:sync': () => composer.sync(),
      'latex:kill': () => latex.process.killChildProcesses(),
      'latex:sync-log': () => latex.log.sync(),
      'core:close': () => this.handleHideLogPanel(),
      'core:cancel': () => this.handleHideLogPanel()
    }))

    this.disposables.add(atom.workspace.observeTextEditors(editor => {
      this.disposables.add(editor.onDidSave(() => {
        // Let's play it safe; only trigger builds for the active editor.
        const activeEditor = atom.workspace.getActiveTextEditor()
        if (editor === activeEditor && atom.config.get('latex.buildOnSave')) {
          composer.build()
        }
      }))
    }))
  },

  deactivate () {
    if (this.disposables) {
      this.disposables.dispose()
      delete this.disposables
    }

    if (global.composer) {
      composer.destroy()
      delete global.composer
    }

    if (global.latex) {
      delete global.latex
    }
  },

  handleHideLogPanel () {
    if (latex && latex.log) {
      latex.log.hide()
    }
  },

  consumeStatusBar (statusBar) {
    this.bootstrap()
    latex.status.attachStatusBar(statusBar)
    return new Disposable(() => {
      if (latex) latex.status.detachStatusBar()
    })
  },

  bootstrap () {
    if (global.composer && global.latex) { return }

    const Latex = require('./latex')
    const Composer = require('./composer')

    global.latex = new Latex()
    global.composer = new Composer()
  }
}
