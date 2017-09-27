/** @babel */

import { CompositeDisposable, Disposable } from 'atom'

export default {
  activate (serialized) {
    this.bootstrap()

    if (serialized && serialized.messages) {
      latex.log.setMessages(serialized.messages)
    }

    this.disposables.add(atom.commands.add('atom-workspace', {
      'latex:build': () => latex.composer.build(false),
      'latex:check-runtime': () => this.checkRuntime(),
      'latex:clean': () => latex.composer.clean(),
      'latex:clear-log': () => latex.log.clear(),
      'latex:hide-log': () => latex.log.hide(),
      'latex:kill': () => latex.composer.kill(),
      'latex:rebuild': () => latex.composer.build(true),
      'latex:show-log': () => latex.log.show(),
      'latex:sync-log': () => latex.log.sync(),
      'latex:sync': () => latex.composer.sync(),
      'latex:toggle-log': () => latex.log.toggle()
    }))

    this.disposables.add(atom.workspace.observeTextEditors(editor => {
      this.disposables.add(editor.onDidSave(() => {
        // Let's play it safe; only trigger builds for the active editor.
        const activeEditor = atom.workspace.getActiveTextEditor()
        if (editor === activeEditor && atom.config.get('latex.buildOnSave')) {
          latex.composer.build(false, false)
        }
      }))
    }))

    const MarkerManager = require('./marker-manager')
    this.disposables.add(atom.workspace.observeTextEditors(editor => {
      this.disposables.add(new MarkerManager(editor))
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

  serialize () {
    return { messages: latex.log.getMessages(false) }
  },

  consumeStatusBar (statusBar) {
    this.bootstrap()
    latex.status.attachStatusBar(statusBar)
    return new Disposable(() => {
      if (global.latex) {
        global.latex.status.detachStatusBar()
      }
    })
  },

  deserializeLog (serialized) {
    this.bootstrap()
    const LogDock = require('./views/log-dock')
    return new LogDock()
  },

  bootstrap () {
    if (!this.disposables) {
      this.disposables = new CompositeDisposable()
    }

    if (global.latex) { return }

    const Latex = require('./latex')
    global.latex = new Latex()
    this.disposables.add(global.latex)
  },

  async checkRuntime () {
    // latex.log.group('LaTeX Check')
    latex.log.clear()
    await latex.builderRegistry.checkRuntimeDependencies()
    latex.opener.checkRuntimeDependencies()
    // latex.log.groupEnd()
  }
}
