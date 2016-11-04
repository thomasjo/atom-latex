/** @babel */

import Logger from '../logger'
import LogPanel from '../views/log-panel'
import ErrorMarker from '../error-marker'
import { getEditorDetails } from '../werkzeug'

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
    latex.status.show('LaTeX Log', this.type, icon, false, 'Click to toggle LaTeX log.', () => this.toggle())
  }

  showErrorMarkers (messages) {
    const editors = atom.workspace.getTextEditors()

    this.destroyErrorMarkers()

    for (const editor of editors) {
      this.showErrorMarkersInEditor(editor, messages)
    }
  }

  showErrorMarkersInEditor (editor, messages) {
    const filePath = editor.getPath()
    if (filePath) {
      const marker = messages.filter(message =>
        message.filePath && message.range && filePath.includes(message.filePath))
      if (marker.length) this.addErrorMarker(editor, marker)
    }
  }

  addErrorMarker (editor, messages) {
    this.errorMarkers.push(new ErrorMarker(editor, messages))
  }

  show () {
    if (!this.view.isVisible()) {
      this.view.show()
      this.updateStatus()
    }
  }

  hide () {
    if (this.view.isVisible()) {
      this.view.hide()
      this.updateStatus()
    }
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
    const { filePath, position } = getEditorDetails()
    if (filePath) {
      this.show()
      this.logPanel.update({ filePath, position })
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
