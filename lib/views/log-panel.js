/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
import etch from 'etch'
import LogMessage from './log-message'

export default class LogPanel {
  constructor (properties) {
    this.setProperties(properties)
    etch.initialize(this)
  }

  render () {
    return <div className='tool-panel panel-bottom latex-log' tabindex='-1'>
      <div className='panel-resize-handle' onmousedown={e => this.startResize(e)} onmousemove={e => this.resize(e)} onmouseup={e => this.stopResize(e)} />
      <div className='panel-body' style={`height:${this.height}px;`}>
        {this.messages.map(message => <LogMessage message={message} />)}
      </div>
    </div>
  }

  setProperties (properties) {
    this.messages = _.sortBy(properties.messages || [],
      [message => message.range ? message.range[0][0] : -1, message => message.logRange ? message.logRange[0][0] : -1])
    this.height = properties.height || 100
  }

  update (properties) {
    this.setProperties(properties)
    return etch.update(this)
  }

  startResize () {
  }

  stopResize () {
  }

  resize (e) {
  }
}
