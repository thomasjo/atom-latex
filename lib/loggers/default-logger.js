/** @babel */

import _ from 'lodash'
import Logger from '../logger'
import LogPanel from '../views/log-panel'
import ErrorMarker from '../error-marker'
import { getEditorDetails } from '../werkzeug'

export default class DefaultLogger extends Logger {
  label = 'LaTeX Log'
  messages = []
  logPanel = new LogPanel()
  errorMarkers = new Map()

  constructor () {
    super()
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

  group (label) {
    this.label = label
    this.messages = []
    this.updateStatus()
    this.destroyErrorMarkers()
  }

  showMessages (messages) {
    this.messages = _.sortBy(this.messages.concat(messages), 'filePath', message => { return message.range || [[-1, -1], [-1, -1]] }, 'type', 'text')
    this.logPanel.update({ messages: this.messages })
    this.showErrorMarkers(messages)
    this.initializeStatus()
  }

  initializeStatus () {
    this.type = Logger.getMostSevereType(this.messages)
    this.updateStatus()
  }

  updateStatus () {
    const icon = this.view.isVisible() ? 'chevron-down' : 'chevron-up'
    latex.status.show(this.label, this.type, icon, false, 'Click to toggle LaTeX log.', () => this.toggle())
  }

  showErrorMarkers (messages) {
    const editors = atom.workspace.getTextEditors()
    for (const editor of editors) {
      this.showErrorMarkersInEditor(editor, messages)
    }
  }

  showErrorMarkersInEditor (editor, messages) {
    const filePath = editor.getPath()
    if (filePath) {
      const m = _.filter(messages, message => {
        return message.filePath && message.range && filePath.includes(message.filePath)
      })
      if (m.length) this.addErrorMarker(editor, m)
    }
  }

  addErrorMarker (editor, messages) {
    let errorMarker = this.errorMarkers.get(editor)
    if (!errorMarker) {
      errorMarker = new ErrorMarker(editor)
      this.errorMarkers.set(editor, errorMarker)
    }
    errorMarker.mark(messages)
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
    const { filePath, position } = getEditorDetails()
    if (filePath) {
      this.show()
      this.logPanel.update({ filePath, position })
    }
  }

  destroyErrorMarkers () {
    for (const errorMarker of this.errorMarkers.values()) {
      errorMarker.destroy()
    }
    this.errorMarkers.clear()
  }
}
