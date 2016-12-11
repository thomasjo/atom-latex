/* @flow */

import _ from 'lodash'
import { Range } from 'atom'
import type { LogMessage } from './types'

export default class Logger {
  messages: Array<LogMessage>
  _group: ?Array<LogMessage>
  _label: string

  constructor (): void {
    this.messages = []
    this._group = null
  }

  error (text: string, filePath?: string, range?: Range, logPath?: string, logRange?: Range): void {
    this.showMessage({ type: 'error', text, filePath, range, logPath, logRange })
  }

  warning (text: string, filePath?: string, range?: Range, logPath?: string, logRange?: Range): void {
    this.showMessage({ type: 'warning', text, filePath, range, logPath, logRange })
  }

  info (text: string, filePath?: string, range?: Range, logPath?: string, logRange?: Range): void {
    this.showMessage({ type: 'info', text, filePath, range, logPath, logRange })
  }

  showMessage (message: LogMessage): void {
    message = Object.assign({ timestamp: Date.now() }, _.pickBy(message))
    if (this._group) {
      this._group.push(message)
    } else {
      this._label = 'LaTeX Message'
      this._group = [message]
      this.groupEnd()
    }
  }

  group (label: string): void {
    this._label = label
    this._group = []
  }

  groupEnd (): void {
    this.messages = _.sortBy(this._group, 'filePath', message => { return message.range || [[-1, -1], [-1, -1]] }, 'type', 'timestamp')
    this._group = null
    this.showFilteredMessages()
  }

  showFilteredMessages (): void {
    const loggingLevel: string = atom.config.get('latex.loggingLevel')
    const showBuildWarning: boolean = loggingLevel !== 'error'
    const showBuildInfo: boolean = loggingLevel === 'info'
    const filteredMessages: Array<LogMessage> = this.messages.filter((message: LogMessage): boolean =>
      message.type === 'error' || (showBuildWarning && message.type === 'warning') || (showBuildInfo && message.type === 'info'))

    this.showMessages(this._label, filteredMessages)
  }

  static getMostSevereType (messages: Array<LogMessage>): ?string {
    return messages.reduce((type: ?string, message: LogMessage) => {
      if (type === 'error' || message.type === 'error') return 'error'
      if (type === 'warning' || message.type === 'warning') return 'warning'
      return 'info'
    }, undefined)
  }

  showMessages (label: string, messages: Array<LogMessage>): void {}
  sync (): void {}
  toggle (): void {}
  show (): void {}
  hide (): void {}

}
