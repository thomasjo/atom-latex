/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
import etch from 'etch'
import LogMessage from './log-message'

export default class LogPanel {
  constructor (properties) {
    this.setProperties(properties)
    this.resizeZero = 0
    this.height = 100
    this.mouseMoveListener = e => this.resize(e)
    this.mouseUpListener = e => this.stopResize(e)
    etch.initialize(this)
  }

  render () {
    // max-height is used so the panel will collapse if possible.
    return <div className='tool-panel panel-bottom latex-log' tabindex='-1'>
      <div className='panel-resize-handle' onmousedown={e => this.startResize(e)} />
      <div className='panel-body' ref='body' style={`max-height:${this.height}px;`}>
        {this.messages.map(message => <LogMessage message={message} />)}
      </div>
    </div>
  }

  setProperties (properties) {
    this.messages = _.sortBy(properties.messages || [], [
      message => message.range ? message.range[0][0] : -1,
      message => message.logRange ? message.logRange[0][0] : -1
    ])
  }

  update (properties) {
    this.setProperties(properties)
    return etch.update(this)
  }

  startResize (e) {
    this.resizeZero = e.clientY + this.refs.body.offsetHeight
    this.refs.body.style.height = `${this.height}px`
    this.refs.body.style.maxHeight = ''
    document.addEventListener('mousemove', this.mouseMoveListener, true)
    document.addEventListener('mouseup', this.mouseUpListener, true)
  }

  stopResize () {
    this.resizing = false
    document.removeEventListener('mousemove', this.mouseMoveListener, true)
    document.removeEventListener('mouseup', this.mouseMoveUp, true)
  }

  resize (e) {
    this.height = Math.max(this.resizeZero - e.clientY, 25)
    this.refs.body.style.height = `${this.height}px`
  }
}
