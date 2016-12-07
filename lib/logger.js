/* @flow */

import _ from 'lodash'
import { Range } from 'atom'
import type { LogMessage } from './types'

export default class Logger {
  messages: Array<LogMessage>
  _group: ?Array<LogMessage>
  _label: string

  constructor () {
    this.messages = []
    this._group = null
  }

  error (text: string, filePath: ?string, range: ?Range, logPath: ?string, logRange: ?Range) {
    this.showMessage({ type: 'error', text, filePath, range, logPath, logRange })
  }

  warning (text: string, filePath: ?string, range: ?Range, logPath: ?string, logRange: ?Range) {
    this.showMessage({ type: 'warning', text, filePath, range, logPath, logRange })
  }

  info (text: string, filePath: ?string, range: ?Range, logPath: ?string, logRange: ?Range) {
    this.showMessage({ type: 'info', text, filePath, range, logPath, logRange })
  }

  showMessage (message: LogMessage) {
    message = Object.assign({ timestamp: Date.now() }, _.pickBy(message))
    if (this._group) {
      this._group.push(message)
    } else {
      this._label = 'LaTeX Message'
      this._group = [message]
      this.groupEnd()
    }
  }

  group (label: string) {
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

  static getMostSevereType (messages): ?string {
    return messages.reduce((type, message) => {
      if (type === 'error' || message.type === 'error') return 'error'
      if (type === 'warning' || message.type === 'warning') return 'warning'
      return 'info'
    }, undefined)
  }

  showMessages (label: string, messages: Array<LogMessage>) {}
  sync () {}
  toggle () {}
  show () {}
  hide () {}

}
