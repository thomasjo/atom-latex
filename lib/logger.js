/** @babel */

import _ from 'lodash'

export default class Logger {
  constructor () {
    this.messages = []
    this._group = null
  }

  error (text, filePath, range, logPath, logRange) {
    this.showMessage({ type: 'Error', text: text, filePath: filePath, range: range, logPath: logPath, logRange: logRange })
  }

  warning (text, filePath, range, logPath, logRange) {
    this.showMessage({ type: 'Warning', text: text, filePath: filePath, range: range, logPath: logPath, logRange: logRange })
  }

  info (text, filePath, range, logPath, logRange) {
    this.showMessage({ type: 'Info', text: text, filePath: filePath, range: range, logPath: logPath, logRange: logRange })
  }

  showMessage (message) {
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
    this.messages = _.sortBy(this._group, 'filePath', message => { return message.range || [[-1, -1], [-1, -1]] }, 'type', 'text')
    this._group = null
    this.showFilteredMessages()
  }

  showFilteredMessages () {
    const loggingLevel = atom.config.get('latex.loggingLevel')
    const showBuildWarning = loggingLevel !== 'error'
    const showBuildInfo = loggingLevel === 'info'
    this.show(this._label, _.filter(this.messages, (message) => {
      return message.type === 'Error' || (showBuildWarning && message.type === 'Warning') || (showBuildInfo && message.type === 'Info')
    }))
  }

  async diagnostics (diagnosticsReport) {
    // Remove all info messages
    const messages = _.filter(this.messages, message => message.type !== 'Info')
    if (messages.length === 0) return

    diagnosticsReport.addSection('Log Messages')
    let detailed =
      '| Type | Message |\n' +
      '|:----:|:--------|\n'

    for (const message of messages) {
      const icon = message.type === 'Error' ? ':exclamation:' : ':warning:'
      detailed += `| ${icon} | ${message.text} `
      if (message.filePath) {
        detailed += `<br> *[${message.filePath}${message.range ? ':' + message.range[0][0] : ''}]* `
      }
      detailed += '|\n'
    }

    diagnosticsReport.addDetailed(detailed)
  }

  show (/* label, messages */) {}

}
