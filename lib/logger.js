/** @babel */

import _ from 'lodash'
import { CompositeDisposable, Disposable, Emitter } from 'atom'
import { getEditorDetails } from './werkzeug'

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
    this.messages = []
  }

  onMessages (callback) {
    return this.emitter.on('messages', callback)
  }

  error (text, filePath, range, logPath, logRange) {
    this.showMessage({ type: 'error', text, filePath, range, logPath, logRange })
  }

  warning (text, filePath, range, logPath, logRange) {
    this.showMessage({ type: 'warning', text, filePath, range, logPath, logRange })
  }

  info (text, filePath, range, logPath, logRange) {
    this.showMessage({ type: 'info', text, filePath, range, logPath, logRange })
  }

  showMessage (message) {
    message = Object.assign({ timestamp: Date.now() }, _.pickBy(message))
    this.messages.push(message)
    if (this.shouldShowMessage(message)) {
      this.emitter.emit('messages', [message], false)
    }
  }

  clear () {
    this.messages = []
    this.refresh()
  }

  refresh () {
    this.emitter.emit('messages', this.getMessages(), true)
  }

  getMessages (useFilters = true) {
    return useFilters
      ? this.messages.filter(message => this.shouldShowMessage(message))
      : this.messages
  }

  setMessages (messages) {
    this.messages = messages
    this.emitter.emit('messages', messages, true)
  }

  shouldShowMessage (message) {
    return message.type === 'error' ||
      (this.loggingLevel !== 'error' && message.type === 'warning') ||
      (this.loggingLevel === 'info' && message.type === 'info')
  }

  static getMostSevereType (messages) {
    return messages.reduce((type, message) => {
      if (type === 'error' || message.type === 'error') return 'error'
      if (type === 'warning' || message.type === 'warning') return 'warning'
      return 'info'
    }, undefined)
  }

  async sync () {
    const { filePath, position } = getEditorDetails()
    if (filePath) {
      const logDock = await atom.workspace.open('atom://latex/log')
      if (logDock) {
        logDock.update({ filePath, position })
      }
    }
  }

  toggle () {
    atom.workspace.toggle('atom://latex/log')
  }

  show () {
    atom.workspace.open('atom://latex/log')
  }

  hide () {
    atom.workspace.hide('atom://latex/log')
  }
}
