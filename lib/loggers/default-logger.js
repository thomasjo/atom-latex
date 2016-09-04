'use babel'

import _ from 'lodash'
import Logger from '../logger'

export default class DefaultLogger extends Logger {
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
      const text = `${message.filePath}:${message.range ? message.range[0][0] : ''}: ${message.text}`
      switch (message.type) {
        case 'Error':
          console.error(text)
          break
        case 'Warning':
          console.warn(text)
          break
        default:
          console.log(text)
      }
    }
    console.groupEnd()

    for (const editor of editors) {
      if (editor.getPath()) {
        const m = _.filter(messages, message => {
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
      for (const errorMarker of this.errorMarkers) {
        errorMarker.clear()
      }
      this.errorMarkers = []
    }
  }

}
