/** @babel */

import _ from 'lodash'
import Logger from '../logger'
import LogPanel from '../views/log-panel'
import ErrorMarker from '../error-marker'

export default class DefaultLogger extends Logger {
  constructor () {
    super()
    this.logPanel = new LogPanel()
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
    this.logPanel.update({ messages: messages })
    this.showErrorMarkers(messages)
    this.initializeStatus(messages)
  }

  initializeStatus (messages) {
    this.type = Logger.getMostSevereType(messages)
    this.updateStatus()
  }

  updateStatus () {
    const icon = this.view.isVisible() ? 'chevron-down' : 'chevron-up'
    latex.setStatus('LaTeX Log', this.type, icon, false, () => this.toggle())
  }

  showErrorMarkers (messages) {
    const editors = atom.workspace.getTextEditors()

    this.destroyErrorMarkers()

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
    this.updateStatus()
  }

  hide () {
    this.view.hide()
    this.updateStatus()
  }

  toggle () {
    if (this.view.isVisible()) {
      this.view.hide()
    } else {
      this.view.show()
    }
    this.updateStatus()
  }

  sync () {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor) {
      this.show()
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
    }
    this.errorMarkers = []
  }
}
