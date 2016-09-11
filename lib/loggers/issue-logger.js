/** @babel */

import _ from 'lodash'
import Logger from '../logger'

export default class IssueLogger extends Logger {
  show (label, messages) {
    const padding = 9
    const indent = 14
    const stack = _.map(messages,
      message => {
        let text = _.padEnd(`[${_.pad(message.type, padding)}]`, indent) + message.text
        if (message.filePath || message.range) {
          text += '\n' + _.repeat(' ', indent) + message.filePath
          if (message.range) text += ` at line ${message.range[0][0] + 1}`
        }
        return text
      }).join('\n')
    const firstSignificant = _.find(messages, message => message.type === 'Error') ||
      _.find(messages, message => message.type === 'Warning')

    atom.notifications.addFatalError(firstSignificant ? firstSignificant.text.replace(/`/g, '\\`') : 'Unknown Error', {
      packageName: 'latex',
      detail: 'various locations',
      stack: stack
    })
  }
}
