'use babel'

import ConfigSchema from './config-schema'

export default {
  config: ConfigSchema,

  activate () {
    this.commands = atom.commands.add('atom-workspace', {
      'latex:build': () => {
        this.bootstrap()
        this.composer.build()
      },
      'latex:sync': () => {
        this.bootstrap()
        this.composer.sync()
      },
      'latex:clean': () => {
        this.bootstrap()
        this.composer.clean()
      }
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
