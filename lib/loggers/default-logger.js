'use babel'

import _ from 'lodash'
import Logger from '../logger'

export default class DefaultLogger extends Logger {
  constructor () {
    super()
    this.colors = {
      Error: 'red',
      Warning: 'yellow',
      Info: 'blue'
    }
  }

  destroy () {
    this.destroyErrorMarkers()
  }

  show (label, messages) {
    if (this.errorMarkers && this.errorMarkers.length > 0) { this.destroyErrorMarkers() }
    const editors = atom.workspace.getTextEditors()
    this.errorMarkers = []
    const ErrorMarker = require('../error-marker')

    console.group(label)
    for (const message of messages) {
      console.log(`[${message.type}] ${message.text}`, `color: ${this.colors[message.type]}`)
    }
    console.groupEnd()

    for (let editor of editors) {
      if (editor.getPath()) {
        let m = _.filter(messages, message => {
          return message.filePath && message.range && editor.getPath().includes(message.filePath)
        })
        if (m.length) {
          this.errorMarkers.push(new ErrorMarker(editor, m))
        }
      }
    }
  }

  destroyErrorMarkers () {
    if (this.errorMarkers) {
      for (let errorMarker of this.errorMarkers) {
        errorMarker.clear()
        errorMarker = null
      }
      this.errorMarkers = []
    }
  }

}
