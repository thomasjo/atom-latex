/** @babel */

import _ from 'lodash'
import { CompositeDisposable, Disposable, Emitter } from 'atom'
import { getEditorDetails } from './werkzeug'
import LogDock from './views/log-dock'

export default class Logger extends Disposable {
  disposables = new CompositeDisposable()
  emitter = new Emitter()

  constructor () {
    super(() => this.disposables.dispose())
    this.loggingLevel = atom.config.get('latex.loggingLevel')
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', () => {
      this.loggingLevel = atom.config.get('latex.loggingLevel')
      this.refresh()
    }))
    this.disposables.add(this.emitter)
    this.disposables.add(atom.workspace.addOpener(uri => {
      if (uri === LogDock.LOG_DOCK_URI) {
        return new LogDock()
      }
    }))

    this.messages = []
  }

  onMessages (callback) {
    return this.emitter.on('messages', callback)
  }

  error (text, filePath, range, logPath, logRange) {
    this.showMessages([{ type: 'error', text, filePath, range, logPath, logRange }])
  }

  warning (text, filePath, range, logPath, logRange) {
    this.showMessages([{ type: 'warning', text, filePath, range, logPath, logRange }])
  }

  info (text, filePath, range, logPath, logRange) {
    this.showMessages([{ type: 'info', text, filePath, range, logPath, logRange }])
  }

  showMessages (messages) {
    messages = messages.map(message => _.pickBy(message))
    this.messages = this.messages.concat(messages)

    const filteredMessages = messages.filter(message => this.messageTypeIsVisible(message.type))

    if (filteredMessages.length > 0) {
      this.emitter.emit('messages', { messages: filteredMessages, reset: false })
    }
  }

  clear () {
    this.messages = []
    this.refresh()
  }

  refresh () {
    this.emitter.emit('messages', { messages: this.getMessages(), reset: true })
  }

  getMessages (useFilters = true) {
    return useFilters
      ? this.messages.filter(message => this.messageTypeIsVisible(message.type))
      : this.messages
  }

  setMessages (messages) {
    this.messages = messages
    this.emitter.emit('messages', { messages, reset: true })
  }

  messageTypeIsVisible (type) {
    return type === 'error' ||
      (this.loggingLevel !== 'error' && type === 'warning') ||
      (this.loggingLevel === 'info' && type === 'info')
  }

  async sync () {
    // FIXME: There should be no direct interaction with editors. The required
    //        values should be arguments.
    const { filePath, position } = getEditorDetails()
    if (filePath) {
      const logDock = await this.show()
      if (logDock) {
        logDock.update({ filePath, position })
      }
    }
  }

  async toggle () {
    return atom.workspace.toggle(LogDock.LOG_DOCK_URI)
  }

  async show () {
    return atom.workspace.open(LogDock.LOG_DOCK_URI)
  }

  async hide () {
    return atom.workspace.hide(LogDock.LOG_DOCK_URI)
  }
}
