/** @babel */

import StatusLabel from './views/status-label'
import { Disposable } from 'atom'

export default class StatusIndicator extends Disposable {
  constructor () {
    super(() => this.detachStatusBar())
  }

  attachStatusBar (statusBar) {
    this.statusLabel = new StatusLabel()
    this.statusTile = statusBar.addLeftTile({
      item: this.statusLabel,
      priority: 9001
    })
  }

  detachStatusBar () {
    if (this.statusTile) {
      this.statusTile.destroy()
      this.statusTile = null
    }
    if (this.statusLabel) {
      this.statusLabel.destroy()
      this.statusLabel = null
    }
  }

  setBusy () {
    if (this.statusLabel) {
      this.statusLabel.update({ busy: true })
    }
  }

  setIdle () {
    if (this.statusLabel) {
      this.statusLabel.update({ busy: false })
    }
  }

  show (text, type, icon, spin, title, onClick) {
    if (this.statusLabel) {
      this.statusLabel.update({ text, type, icon, spin, title, onClick })
    }
  }
}
