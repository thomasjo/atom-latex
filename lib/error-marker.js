/* @flow */

import _ from 'lodash'
import { TextEditor } from 'atom'
import Logger from './logger'
import type { LogMessage } from './types'

export default class ErrorMarker {
  editor: TextEditor
  messages: Array<LogMessage>
  markers: Array<Object>

  constructor (editor: TextEditor, messages: Array<LogMessage>): void {
    this.editor = editor
    this.messages = messages
    this.markers = []
    this.mark()
  }

  mark () {
    this.markers = _.map(_.groupBy(this.messages, 'range'), (messages: Array<LogMessage>): Object => {
      const type: string = Logger.getMostSevereType(messages) || 'info'
      const marker: Object = this.editor.markBufferRange(messages[0].range, { invalidate: 'touch' })
      this.editor.decorateMarker(marker, { type: 'line-number', class: `latex-${type}` })
      return marker
    })
  }

  clear () {
    for (const marker: Object of this.markers) {
      marker.destroy()
    }
    this.markers = []
  }
}
