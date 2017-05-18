/** @babel */

import { CompositeDisposable, Disposable } from 'atom'

export default class MarkerManager extends Disposable {
  disposables = new CompositeDisposable()

  constructor (editor) {
    super(() => this.disposables.dispose())

    this.editor = editor
    this.markers = []

    this.disposables.add(latex.log.onMessages((messages, reset) => this.addMarkers(messages, reset)))
    this.disposables.add(new Disposable(() => this.clear()))
    this.disposables.add(this.editor.onDidDestroy(() => this.dispose()))

    this.addMarkers(latex.log.getMessages())
  }

  addMarkers (messages, reset) {
    const filePath = this.editor.getPath()

    if (reset) this.clear()

    if (filePath) {
      for (const message of messages) {
        if (message.filePath && message.range && filePath.includes(message.filePath)) {
          this.addMarker(message)
        }
      }
    }
  }

  addMarker (message) {
    const marker = this.editor.markBufferRange(message.range, { invalidate: 'touch' })
    this.editor.decorateMarker(marker, { type: 'line-number', class: `latex-${message.type}` })
    this.markers.push(marker)
  }

  clear () {
    for (const marker of this.markers) {
      marker.destroy()
    }
    this.markers = []
  }
}
