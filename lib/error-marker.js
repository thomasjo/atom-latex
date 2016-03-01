'use babel'

export default class ErrorMarker {
  constructor (editor, errors, warnings) {
    this.editor = editor
    this.errors = errors
    this.warnings = warnings
    this.markers = []
    this.mark()
  }

  mark () {
    for (let error of this.errors) {
      this.markRow(error.lineNumber - 1, 'latex-error')
    }
    for (let warning of this.warnings) {
      this.markRow(warning.lineNumber - 1, 'latex-warning')
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
