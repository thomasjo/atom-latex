/** @babel */

import _ from 'lodash'
import EventEmitter from 'events'
import { CompositeDisposable } from 'atom'

export default class Logger extends EventEmitter {
  disposables = new CompositeDisposable()

  constructor () {
    super()
    this.loggingLevel = atom.config.get('latex.loggingLevel')
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', () => {
      this.loggingLevel = atom.config.get('latex.loggingLevel')
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
      this.emit('messages', [message])
    }
  }

  clear () {
    this.messages = []
    this.emit('clear')
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

  showMessages (/* label, messages */) {}
  sync () {}
  toggle () {}
  show () {}
  hide () {}
}
