/** @babel */

import _ from 'lodash'
import Logger from '../logger'

export default class ReportLogger extends Logger {
  destroy () {
  }

  show (label, messages) {
    const stack = _.map(messages,
      message => {
        let text = `[${message.type}] ${message.type === 'Error' ? '  ' : (message.type === 'Info' ? '   ' : '')} ${message.text}`
        if (message.filePath || message.range) {
          text += '\n           ' + message.filePath
          if (message.range) text += ` at line ${message.range[0][0] + 1}`
        }
        return text
      }).join('\n')
    const firstSignificant = _.find(messages, message => message.type === 'Error') ||
      _.find(messages, message => message.type === 'Warning')
    atom.notifications.addFatalError(firstSignificant ? firstSignificant.text.replace(/`/g, '\\`') : 'Unknown Error', {
      packageName: 'latex',
      detail: 'various locations',
      stack: stack,
      dismissable: false
    })
  }
}
