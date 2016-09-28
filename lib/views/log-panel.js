/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
import etch from 'etch'
import LogMessageList from './log-message-list'

export default class LogPanel {
  constructor (properties) {
    this.setProperties(properties)
    etch.initialize(this)
  }

  render () {
    return <div className='tool-panel panel-bottom native-key-bindings' tabindex='-1'>
      <div className='panel-resize-handle' style='position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3' />
      <div className='panel-heading'>
        <div className='heading-title inline-block icon-info' />
        <div className='heading-title inline-block'>LaTeX Messages</div>
        <div className='heading-buttons inline-block pull-right'>
          <div className='heading-fold inline-block icon-fold' style='cursor: pointer' onclick={() => this.toggle()} ref='toggleButton' />
          <div className='heading-close inline-block icon-x' style='cursor: pointer' onclick={() => this.close()} />
        </div>
      </div>
      <LogMessageList messages={this.messages} ref='logMessageList' />
    </div>
  }

  setProperties (properties) {
    this.messages = _.sortBy(properties.messages || [],
      [message => message.range ? message.range[0][0] : -1, message => message.logRange ? message.logRange[0][0] : -1])
    this.folded = properties.folded
  }

  update (properties) {
    this.setProperties(properties)
    return etch.update(this)
  }

  toggle () {
  }

  close () {
  }
}
