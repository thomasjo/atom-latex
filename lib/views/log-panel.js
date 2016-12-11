/* @flow */
/** @jsx etch.dom */

import _ from 'lodash'
import etch from 'etch'
import { Point } from 'atom'
import LogMessageView from './log-message'

export default class LogPanel {
  messages: Array<LogMessageView> = []
  resizeZero: number = 0
  height: number = 100
  filePath: string
  position: Point
  refs: Object
  resizing: boolean
  mouseMoveListener: Function
  mouseUpListener: Function

  constructor (properties: Object = {}): void {
    this.mouseMoveListener = e => this.resize(e)
    this.mouseUpListener = e => this.stopResize(e)

    this.setProperties(properties)
    etch.initialize(this)
  }

  async destroy () {
    await etch.destroy(this)
  }

  render () {
    // max-height is used so the panel will collapse if possible.
    const style = `max-height:${this.height}px;`
    let content = this.messages.map(message => <LogMessageView message={message} filePath={this.filePath} position={this.position} />)
    if (!content.length) {
      content = <div>No LaTeX messages</div>
    }

    return <div className='tool-panel panel-bottom latex-log' tabindex='-1'>
      <div className='panel-resize-handle' onmousedown={e => this.startResize(e)} />
      <div className='panel-body' ref='body' style={style}>
        {content}
      </div>
    </div>
  }

  setProperties (properties: Object) {
    if (properties.messages) {
      this.messages = _.sortBy(properties.messages, [
        message => message.range ? message.range[0][0] : -1,
        message => message.logRange ? message.logRange[0][0] : -1
      ])
    }
    this.filePath = properties.filePath
    this.position = properties.position
  }

  update (properties: Object) {
    this.setProperties(properties)
    return etch.update(this)
  }

  readAfterUpdate () {
    // Look for highlighted messages and scroll to them
    const highlighted = this.refs.body.getElementsByClassName('latex-highlight')
    if (highlighted.length) {
      highlighted[0].scrollIntoView()
    }
  }

  startResize (e: Object) {
    this.resizeZero = e.clientY + this.refs.body.offsetHeight
    this.refs.body.style.height = `${this.height}px`
    this.refs.body.style.maxHeight = ''
    document.addEventListener('mousemove', this.mouseMoveListener, true)
    document.addEventListener('mouseup', this.mouseUpListener, true)
  }

  stopResize () {
    this.resizing = false
    document.removeEventListener('mousemove', this.mouseMoveListener, true)
    document.removeEventListener('mouseup', this.mouseUpListener, true)
  }

  resize (e: Object) {
    this.height = Math.max(this.resizeZero - e.clientY, 25)
    this.refs.body.style.height = `${this.height}px`
  }
}
