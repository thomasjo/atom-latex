'use babel'

export default class ErrorMarker {
  constructor(editor, errors, warnings) {
    this.editor = editor
    this.errors = errors
    this.warnings = warnings
    this.markers = []
    this.mark()
  }

  mark() {
    for (error of this.errors){
      this.markRow(error.lineNumber - 1, 'line-red')
    }
    for (warning of this.warnings){
      this.markRow(error.lineNumber - 1, 'line-yellow')
    }
  }

  markRow(row, colour) {
    column = this.editor.buffer.lineLengthForRow(row)
    marker = this.editor.markBufferRange([[row, 0], [row, column]], {invalidate: 'touch'})
    decoration = this.editor.decorateMarker(marker, {type: 'line-number', class: colour})
    this.markers.push(marker)
  }

  clear() {
    for (marker of this.markers){
      marker.destroy()
    }
  }
}
