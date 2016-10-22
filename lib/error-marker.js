/** @babel */

import _ from 'lodash'
import Logger from './logger'

export default class ErrorMarker {
  constructor (editor, messages) {
    this.editor = editor
    this.messages = messages
    this.markers = []
    this.mark()
  }

  mark () {
    this.markers = _.map(_.groupBy(this.messages, 'range'), messages => {
      const type = Logger.getMostSevereType(messages)
      const marker = this.editor.markBufferRange(messages[0].range, {invalidate: 'touch'})
      this.editor.decorateMarker(marker, {type: 'line-number', class: `latex-${type}`})
      return marker
    })
  }

  clear () {
    for (let marker of this.markers) {
      marker.destroy()
    }
  }
}
