'use babel'

export default class ErrorMarker {
  constructor (editor, messages) {
    this.editor = editor
    this.messages = messages
    this.markers = []
    this.mark()
  }

  mark () {
    for (let message of this.messages) {
      const marker = this.editor.markBufferRange(message.range, {invalidate: 'touch'})
      this.editor.decorateMarker(marker, {type: 'line-number', class: 'latex-' + message.type.toLowerCase()})
      this.markers.push(marker)
    }
  }

  clear () {
    for (let marker of this.markers) {
      marker.destroy()
    }
  }
}
