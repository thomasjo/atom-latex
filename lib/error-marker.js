/** @babel */

export default class ErrorMarker {
  decorations = new Map()

  constructor (editor) {
    this.editor = editor
    this.markerLayer = this.editor.addMarkerLayer()
  }

  destroy () {
    this.markerLayer.destroy()
  }

  mark (messages) {
    for (const message of messages) {
      for (let row = message.range[0][0]; row <= message.range[1][0]; row++) {
        const decoration = this.decorations.get(row)
        const messageClass = `latex-${message.type}`
        if (decoration) {
          const properties = decoration.getProperties()
          if ((properties === 'latex-warning' && message.type === 'error') ||
            (properties.class === 'latex-info' && message.type !== 'info')) {
            properties.class = messageClass
            decoration.setProperties(properties)
          }
        } else {
          const marker = this.markerLayer.markBufferRange([[row, 0], [row, 65536]], { invalidate: 'touch' })
          const decoration = this.editor.decorateMarker(marker, { type: 'line-number', class: messageClass })
          decoration.onDidDestroy(() => this.decorations.delete(decoration))
          this.decorations.set(row, decoration)
        }
      }
    }
  }
}
