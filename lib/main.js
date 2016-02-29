'use babel'

export default {
  activate () {
    this.bootstrap()

    this.commands = atom.commands.add('atom-workspace', {
      'latex:build': () => this.composer.build(),
      'latex:clean': () => this.composer.clean(),
      'latex:sync': () => this.composer.sync()
    })
  },

  deactivate () {
    if (this.commands) {
      this.commands.dispose()
      delete this.commands
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
