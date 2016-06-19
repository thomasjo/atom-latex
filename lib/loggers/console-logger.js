'use babel'

import Logger from '../logger'

export default class ConsoleLogger extends Logger {
  constructor () {
    super()
    this.colors = {
      Error: 'red',
      Warning: 'yellow',
      Info: 'blue'
    }
  }

  show (label, messages) {
    console.group(label)
    for (const message of messages) {
      console.log(`[${message.type}] ${message.text}`, `color: ${this.colors[message.type]}`)
    }
    console.groupEnd()
  }
}
