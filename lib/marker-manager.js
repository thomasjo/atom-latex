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
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', () => this.update()))

    this.addMarkers(latex.log.getMessages())
  }

  update () {
    this.clear()
    this.addMarkers(latex.log.getMessages())
  }

  addMarkers (messages, reset) {
    if (reset) this.clear()

    if (this.editor.getPath()) {
      for (const message of messages) {
        this.addMarker(message.type, message.filePath, message.range)
        this.addMarker(message.type, message.logPath, message.logRange)
      }
    }
  }

  addMarker (type, filePath, range) {
    const currentFilePath = this.editor.getPath()
    if (filePath && range && currentFilePath.includes(filePath)) {
      const marker = this.editor.markBufferRange(range, { invalidate: 'touch' })
      this.editor.decorateMarker(marker, { type: 'line-number', class: `latex-${type}` })
      this.markers.push(marker)
    }
  }

  clear () {
    for (const marker of this.markers) {
      marker.destroy()
    }
    this.markers = []
  }
}