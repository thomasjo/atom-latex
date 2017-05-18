/** @babel */

import _ from 'lodash'
import EventEmitter from 'events'
import { CompositeDisposable } from 'atom'
import { getEditorDetails } from './werkzeug'

export default class Logger extends EventEmitter {
  disposables = new CompositeDisposable()

  constructor () {
    super()
    this.loggingLevel = atom.config.get('latex.loggingLevel')
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', () => {
      this.loggingLevel = atom.config.get('latex.loggingLevel')
      this.refresh()
    }))
    this.messages = []
    this.setMaxListeners(100)
  }

  dispose () {
    this.disposables.dispose()
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
      this.emit('messages', [message], false)
    }
  }

  clear () {
    this.messages = []
    this.refresh()
  }

  refresh () {
    this.emit('messages', this.getMessages(), true)
  }

  getMessages () {
    return this.messages.filter(message => this.shouldShowMessage(message))
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
