/** @babel */

import _ from 'lodash'
import Logger from '../logger'
import LogPanel from '../views/log-panel'

export default class DefaultLogger extends Logger {
  constructor () {
    super()
    this.logPanel = new LogPanel({})
    this.viewProvider = atom.views.addViewProvider(DefaultLogger,
      model => model.logPanel.element)
  }

  destroy () {
    this.destroyErrorMarkers()
    this.viewProvider.dispose()
  }

  show (label, messages) {
    if (this.errorMarkers && this.errorMarkers.length > 0) { this.destroyErrorMarkers() }
    const editors = atom.workspace.getTextEditors()
    this.errorMarkers = []
    const ErrorMarker = require('../error-marker')

    this.logPanel.update({ messages: messages })
    if (!this.view) {
      this.view = atom.workspace.addBottomPanel({
        item: this
      })
    }

    for (const editor of editors) {
      if (editor.getPath()) {
        const m = _.filter(messages, message => {
          return message.filePath && message.range && editor.getPath().includes(message.filePath)
        })
        if (m.length) {
          this.errorMarkers.push(new ErrorMarker(editor, m))
        }
      }
    }
  }

  destroyErrorMarkers () {
    if (this.errorMarkers) {
      for (const errorMarker of this.errorMarkers) {
        errorMarker.clear()
      }
      this.errorMarkers = []
    }
  }
}
