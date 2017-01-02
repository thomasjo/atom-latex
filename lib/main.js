/** @babel */

import { CompositeDisposable, Disposable } from 'atom'

export default {
  activate () {
    this.disposables = new CompositeDisposable()
    this.bootstrap()

    this.disposables.add(atom.commands.add('atom-workspace', {
      'latex:build': () => latex.composer.build(false),
      'latex:rebuild': () => latex.composer.build(true),
      'latex:check-runtime': () => this.checkRuntime(),
      'latex:clean': () => latex.composer.clean(),
      'latex:sync': () => latex.composer.sync(),
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
          latex.composer.build()
        }
      }))
    }))

    if (!atom.inSpecMode()) {
      const checkConfigAndMigrate = require('./config-migrator')
      checkConfigAndMigrate()
    }
  },

  deactivate () {
    if (this.disposables) {
      this.disposables.dispose()
      delete this.disposables
    }

    delete global.latex
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
    if (global.latex) { return }

    const Latex = require('./latex')
    global.latex = new Latex()
    this.disposables.add(global.latex)
  },

  async checkRuntime () {
    latex.log.group('LaTeX Check')
    await latex.builderRegistry.checkRuntimeDependencies()
    latex.opener.checkRuntimeDependencies()
    latex.log.groupEnd()
  }
}
