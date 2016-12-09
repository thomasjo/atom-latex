/* @flow */

import _ from 'lodash'
import { TextEditor } from 'atom'
import Logger from './logger'
import type { LogMessage } from './types'

export default class ErrorMarker {
  editor: TextEditor
  messages: Array<LogMessage>
  markers: Array<Object>

  constructor (editor: TextEditor, messages: Array<LogMessage>) {
    this.editor = editor
    this.messages = messages
    this.markers = []
    this.mark()
  }

  mark () {
    this.markers = _.map(_.groupBy(this.messages, 'range'), messages => {
      const type = Logger.getMostSevereType(messages) || 'info'
      const marker = this.editor.markBufferRange(messages[0].range, { invalidate: 'touch' })
      this.editor.decorateMarker(marker, { type: 'line-number', class: `latex-${type}` })
      return marker
    })
  }

  clear () {
    for (let marker of this.markers) {
      marker.destroy()
    }
  }
}
