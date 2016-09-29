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
    this.view = atom.workspace.addBottomPanel({
      item: this,
      visible: false
    })
  }

  destroy () {
    this.destroyErrorMarkers()
    this.viewProvider.dispose()
    this.view.destroy()
  }

  showMessages (label, messages) {
    if (this.errorMarkers && this.errorMarkers.length > 0) { this.destroyErrorMarkers() }
    const editors = atom.workspace.getTextEditors()
    this.errorMarkers = []
    const ErrorMarker = require('../error-marker')

    this.logPanel.update({ messages: messages })

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

  show () {
    this.view.show()
  }

  hide () {
    this.view.hide()
  }

  toggle () {
    if (this.view.isVisible()) {
      this.view.hide()
    } else {
      this.view.show()
    }
  }

  sync () {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor) {
      this.logPanel.update({
        filePath: textEditor.getPath(),
        position: textEditor.getCursorBufferPosition()
      })
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
