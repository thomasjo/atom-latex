'use babel'

import _ from 'lodash'
import Logger from '../logger'

export default class LinterLogger extends Logger {

  constructor (linterIndie) {
    super()
    this.linterIndie = linterIndie
  }

  show (label, messages) {
    this.linterIndie.setMessages(_.map(messages,
      (message) => {
        let m = {
          type: message.type,
          text: message.text,
          filePath: message.filePath,
          range: message.range
        }
        if (message.logPath) {
          m.trace = [{
            type: 'Trace',
            text: 'LaTeX build log ',
            filePath: message.logPath,
            range: message.logRange
          }]
        }
        return m
      }))
  }

}
