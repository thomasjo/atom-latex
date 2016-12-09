/* @flow */

import StatusLabel from './views/status-label'

export default class StatusIndicator {
  statusLabel: StatusLabel
  statusTile: Object

  dispose () {
    this.detachStatusBar()
  }

  attachStatusBar (statusBar: Object) {
    this.statusLabel = new StatusLabel()
    this.statusTile = statusBar.addRightTile({
      item: this.statusLabel,
      priority: 9001
    })
  }

  detachStatusBar () {
    if (this.statusTile) {
      this.statusTile.destroy()
      delete this.statusTile
    }
    if (this.statusLabel) {
      this.statusLabel.destroy()
      delete this.statusLabel
    }
  }

  show (text: string, type: string, icon: string, spin: boolean, title: string, onClick: Function) {
    if (this.statusLabel) {
      this.statusLabel.update({ text, type, icon, spin, title, onClick })
    }
  }
}
