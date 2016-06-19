'use babel'

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
    this.messages = this._group
    this._group = null
    const showBuildWarning = atom.config.get('latex.showBuildWarning') !== false
    const showBuildInfo = atom.config.get('latex.showBuildInfo') !== false
    this.show(this._label, _.filter(this.messages, (message) => {
      return message.type === 'Error' || (showBuildWarning && message.type === 'Warning') || (showBuildInfo && message.type === 'Info')
    }))
  }

  show (/* label, messages */) {}

}
