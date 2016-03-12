'use babel'

import {CompositeDisposable} from 'atom'

export default {
  activate () {
    this.bootstrap()
    this.disposables = new CompositeDisposable()

    this.disposables.add(atom.commands.add('atom-workspace', {
      'latex:build': () => this.composer.build(),
      'latex:clean': () => this.composer.clean(),
      'latex:sync': () => this.composer.sync()
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
    this.composer.setStatusBar(statusBar)
  },

  bootstrap () {
    if (this.composer && global.latex) { return }

    const Latex = require('./latex')
    const Composer = require('./composer')

    global.latex = new Latex()
    this.composer = new Composer()
  }
}
