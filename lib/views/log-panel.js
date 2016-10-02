/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
import etch from 'etch'
import LogMessage from './log-message'

export default class LogPanel {
  constructor (properties) {
    this.messages = []
    this.resizeZero = 0
    this.height = 100
    this.mouseMoveListener = e => this.resize(e)
    this.mouseUpListener = e => this.stopResize(e)

    this.setProperties(properties)
    etch.initialize(this)
  }

  render () {
    // max-height is used so the panel will collapse if possible.
    const style = `max-height:${this.height}px;`
    return <div className='tool-panel panel-bottom latex-log' tabindex='-1'>
      <div className='panel-resize-handle' onmousedown={e => this.startResize(e)} />
      <div className='panel-body' ref='body' style={style}>
        {this.messages.map(message => <LogMessage message={message} filePath={this.filePath} position={this.position} />)}
      </div>
    </div>
  }

  setProperties (properties) {
    if (properties.messages) {
      this.messages = _.sortBy(properties.messages, [
        message => message.range ? message.range[0][0] : -1,
        message => message.logRange ? message.logRange[0][0] : -1
      ])
    }
    this.filePath = properties.filePath
    this.position = properties.position
  }

  update (properties) {
    this.setProperties(properties)
    return etch.update(this).then(() => this.scrollToHighlighted())
  }

  scrollToHighlighted () {
    const highlighted = this.refs.body.getElementsByClassName('latex-highlight')
    if (highlighted.length) {
      highlighted[0].scrollIntoView()
    }
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
