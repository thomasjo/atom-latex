import React from 'react'
import ReactDOM from 'react-dom'
import { Disposable } from 'atom'

import StatusLabel from './views/status-label'

class ReactProxy<T extends React.ComponentClass> {
  container: HTMLDivElement
  componentClass: T
  component?: React.Component

  constructor (componentClass: T) {
    this.container = document.createElement('div')
    this.componentClass = componentClass
  }

  render () {
    this.component = ReactDOM.render(
      React.createElement(this.componentClass, {}, null),
      this.container
    )
  }

  getElement () {
    this.render()
    return this.container.firstChild
  }
}

export default class StatusIndicator extends Disposable {
  container?: HTMLDivElement
  // statusLabel?: StatusLabel
  statusLabel?: any
  statusTile?: any

  constructor () {
    super(() => this.detachStatusBar())
  }

  attachStatusBar (statusBar: any) {
    this.container = document.createElement('div')
    this.statusLabel = ReactDOM.render(<StatusLabel />, this.container)
    this.statusLabel = ReactDOM.render(
      React.createElement(StatusLabel, {}, null),
      this.container
    )

    this.statusLabel = new ReactProxy(StatusLabel)

    this.statusTile = statusBar.addLeftTile({
      // item: this.container.firstChild,
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
      this.statusLabel.component.setState({ busy: true })
    }
  }

  setIdle () {
    if (this.statusLabel) {
      this.statusLabel.component.setState({ busy: false })
    }
  }

  show (text: any, type: any, icon: any, spin: any, title: any, onClick: any) {
    if (this.statusLabel) {
      this.statusLabel.component.setState({ busy: false })
    }
  }
}
