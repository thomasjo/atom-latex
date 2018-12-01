import React from 'react'
import ReactDOM from 'react-dom'
import { Disposable } from 'atom'

import StatusLabel from './views/status-label'

export default class StatusIndicator extends Disposable {
  container?: HTMLDivElement
  statusLabel?: StatusLabel
  statusTile?: any

  constructor () {
    super(() => this.detachStatusBar())
  }

  attachStatusBar (statusBar: any) {
    this.container = document.createElement('div')
    this.statusLabel = ReactDOM.render(React.createElement(StatusLabel), this.container)

    this.statusTile = statusBar.addLeftTile({
      item: this.statusLabel,
      priority: 9001
    })
  }

  detachStatusBar () {
    if (this.statusTile) {
      this.statusTile.destroy()
      this.statusTile = undefined
    }
    if (this.container && this.statusLabel) {
      ReactDOM.unmountComponentAtNode(this.container)
      this.statusLabel = undefined
    }
  }

  setBusy () {
    if (this.statusLabel) {
      this.statusLabel.setState({ busy: true })
    }
  }

  setIdle () {
    if (this.statusLabel) {
      this.statusLabel.setState({ busy: false })
    }
  }

  show () {
    if (this.statusLabel) {
      this.statusLabel.setState({ busy: false })
    }
  }
}
