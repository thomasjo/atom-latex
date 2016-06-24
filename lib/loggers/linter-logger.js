'use babel'

import _ from 'lodash'
import Logger from '../logger'

export default class LinterLogger extends Logger {

  constructor (linterIndie) {
    super()
    this.linterIndie = linterIndie
  }

  show (label, messages) {
    let linterMessages = []

    for (let i = 0; i < messages.length; i++) {
      if (linterMessages.length === 0 ||
        messages[i - 1].type !== messages[i].type ||
        messages[i - 1].text !== messages[i].text ||
        messages[i - 1].filePath !== messages[i].filePath ||
        !_.isEqual(messages[i - 1].range, messages[i].range)) {
        linterMessages.push({
          type: messages[i].type,
          text: messages[i].text,
          filePath: messages[i].filePath,
          range: messages[i].range,
          trace: []
        })
      }
      if (messages[i].logPath) {
        linterMessages[linterMessages.length - 1].trace.push({
          type: 'Trace',
          text: 'LaTeX build log ',
          filePath: messages[i].logPath,
          range: messages[i].logRange
        })
      }
    }

    console.log(linterMessages)

    this.linterIndie.setMessages(linterMessages)
  }

}
