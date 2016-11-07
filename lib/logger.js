/** @babel */

import _ from 'lodash'

export default class Logger {
  constructor () {
    this.messages = []
    this._group = null
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
    if (this._group) {
      this._group.push(message)
    } else {
      this._label = 'LaTeX Message'
      this._group = [message]
      this.groupEnd()
    }
  }

  group (label) {
    this._label = label
    this._group = []
  }

  groupEnd () {
    this.messages = _.sortBy(this._group, 'filePath', message => { return message.range || [[-1, -1], [-1, -1]] }, 'type', 'timestamp')
    this._group = null
    this.showFilteredMessages()
  }

  showFilteredMessages () {
    const loggingLevel = atom.config.get('latex.loggingLevel')
    const showBuildWarning = loggingLevel !== 'error'
    const showBuildInfo = loggingLevel === 'info'
    const filteredMessages = this.messages.filter(message =>
      message.type === 'error' || (showBuildWarning && message.type === 'warning') || (showBuildInfo && message.type === 'info'))

    this.showMessages(this._label, filteredMessages)
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
