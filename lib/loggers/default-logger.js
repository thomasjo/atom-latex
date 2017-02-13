/* @flow */

import Logger from '../logger'
import LogPanel from '../views/log-panel'
import ErrorMarker from '../error-marker'
// $FlowIgnore
import { getEditorDetails } from '../werkzeug'
import type { EditorDetails, LogMessage } from '../types'
import { TextEditor } from 'atom'

export default class DefaultLogger extends Logger {
  logPanel: LogPanel
  viewProvider: Object
  view: Object
  errorMarkers: Array<ErrorMarker>
  type: ?string

  constructor (): void {
    super()
    this.logPanel = new LogPanel()
    this.viewProvider = atom.views.addViewProvider(DefaultLogger,
      model => model.logPanel.element)
    this.view = atom.workspace.addBottomPanel({
      item: this,
      visible: false
    })
  }

  destroy (): void {
    this.destroyErrorMarkers()
    this.viewProvider.dispose()
    this.view.destroy()
  }

  showMessages (label: string, messages: Array<LogMessage>): void {
    this.logPanel.update({ messages: messages })
    this.showErrorMarkers(messages)
    this.initializeStatus(messages)
  }

  initializeStatus (messages: Array<LogMessage>): void {
    this.type = Logger.getMostSevereType(messages)
    this.updateStatus()
  }

  updateStatus (): void {
    const icon: string = this.view.isVisible() ? 'chevron-down' : 'chevron-up'
    latex.status.show('LaTeX Log', this.type, icon, false, 'Click to toggle LaTeX log.', (): void => this.toggle())
  }

  showErrorMarkers (messages: Array<LogMessage>): void {
    const editors: Array<TextEditor> = atom.workspace.getTextEditors()

    this.destroyErrorMarkers()

    for (const editor: TextEditor of editors) {
      this.showErrorMarkersInEditor(editor, messages)
    }
  }

  showErrorMarkersInEditor (editor: TextEditor, messages: Array<LogMessage>): void {
    const filePath: string = editor.getPath()
    if (filePath) {
      const marker: Array<LogMessage> = messages.filter((message: LogMessage): boolean =>
        !!message.filePath && !!message.range && filePath.includes(message.filePath))
      if (marker.length) this.addErrorMarker(editor, marker)
    }
  }

  addErrorMarker (editor: TextEditor, messages: Array<LogMessage>): void {
    this.errorMarkers.push(new ErrorMarker(editor, messages))
  }

  show (): void {
    if (!this.view.isVisible()) {
      this.view.show()
      this.updateStatus()
    }
  }

  hide (): void {
    if (this.view.isVisible()) {
      this.view.hide()
      this.updateStatus()
    }
  }

  toggle (): void {
    if (this.view.isVisible()) {
      this.view.hide()
    } else {
      this.view.show()
    }
    this.updateStatus()
  }

  sync (): void {
    const { filePath, position }: EditorDetails = getEditorDetails()
    if (filePath) {
      this.show()
      this.logPanel.update({ filePath, position })
    }
  }

  destroyErrorMarkers (): void {
    if (this.errorMarkers) {
      for (const errorMarker: ErrorMarker of this.errorMarkers) {
        errorMarker.clear()
      }
    }
    this.errorMarkers = []
  }
}
