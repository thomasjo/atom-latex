/** @babel */

import _ from 'lodash'

export default class Logger {
  constructor () {
    this.messages = []
    this._group = null
  }

  error (text, filePath, range, logPath, logRange) {
    this.showMessages({ type: 'error', text, filePath, range, logPath, logRange })
  }

  warning (text, filePath, range, logPath, logRange) {
    this.showMessages({ type: 'warning', text, filePath, range, logPath, logRange })
  }

  info (text, filePath, range, logPath, logRange) {
    this.showMessages({ type: 'info', text, filePath, range, logPath, logRange })
  }

  addMessage (message) {
    this.addMessages([message])
  }

  addMessages (messages) {
    const loggingLevel = atom.config.get('latex.loggingLevel')
    const showBuildWarning = loggingLevel !== 'error'
    const showBuildInfo = loggingLevel === 'info'
    const filteredMessages = _.filter(messages, message => {
      return message.type === 'error' || (showBuildWarning && message.type === 'warning') || (showBuildInfo && message.type === 'info')
    })

    if (filteredMessages.length) {
      this.showMessages(filteredMessages)
    }
  }

  static getMostSevereType (messages) {
    return _.reduce(messages, (type, message) => {
      if (type === 'error' || message.type === 'error') return 'error'
      if (type === 'warning' || message.type === 'warning') return 'warning'
      return 'info'
    }, undefined)
  }

  group (label) {}
  groupEnd () {}
  showMessages (messages) {}

  sync () {}
  toggle () {}
  show () {}
  hide () {}

}
