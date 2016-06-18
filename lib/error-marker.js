'use babel'

export default class ErrorMarker {
  constructor (editor, messages) {
    this.editor = editor
    this.messages = messages
    this.markers = []
    this.mark()
  }

  mark () {
    for (let message of this.message) {
      this.markRow(message.lineNumber - 1, 'latex-' + this.message.type.toLowerCase())
    }
  }

  markRow (row, colour) {
    const column = this.editor.buffer.lineLengthForRow(row)
    const marker = this.editor.markBufferRange([[row, 0], [row, column]], {invalidate: 'touch'})
    this.editor.decorateMarker(marker, {type: 'line-number', class: colour})
    this.markers.push(marker)
  }

  clear () {
    for (let marker of this.markers) {
      marker.destroy()
    }
  }
}
