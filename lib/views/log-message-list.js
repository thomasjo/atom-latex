/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import LogMessage from './log-message'

export default class LogMessageList {
  constructor (properties) {
    this.properties = properties
    etch.initialize(this)
  }

  render () {
    return (
      <div className='panel-body padded' style='max-height:170px;overflow-y: scroll;'>
        {this.properties.messages.map(message => <LogMessage message={message} />)}
      </div>
    )
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }
}
