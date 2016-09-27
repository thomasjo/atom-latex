/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
import etch from 'etch'
import path from 'path'
import Logger from '../logger'

class LogMessage {
  constructor (properties) {
    this.properties = properties
    etch.initialize(this)
  }

  render () {
    function fileRef (filePath, range, label) {
      const className = `latex-${label}-ref`
      const lineRef = range ? ` at line ${range[0][0] + 1}` : ''
      const text = path.basename(filePath) + lineRef
      const content = label === 'source' ? ` in ${text}` : ` [from ${text}]`
      const clickHandler = () => {
        atom.workspace.open(filePath, range ? {initialLine: range[0][0]} : {})
      }
      return filePath ? <span className={className} onclick={clickHandler}>{content}</span> : ''
    }

    const message = this.properties.message
    const className = `latex-${message.type.toLowerCase()}`
    return (
      <div className={className}>
        <span>{message.text}</span>
        {fileRef(message.filePath, message.range, 'source')}
        {fileRef(message.logPath, message.logRange, 'log')}
      </div>
    )
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }
}

class LogMessages {
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

export default class DefaultLogger extends Logger {
  constructor () {
    super()
    this.viewProvider = atom.views.addViewProvider(DefaultLogger,
      model => model.element)
    this.filteredMessages = []
    etch.initialize(this)
  }

  destroy () {
    this.destroyErrorMarkers()
    this.viewProvider.dispose()
  }

  show (label, messages) {
    if (this.errorMarkers && this.errorMarkers.length > 0) { this.destroyErrorMarkers() }
    const editors = atom.workspace.getTextEditors()
    this.errorMarkers = []
    const ErrorMarker = require('../error-marker')

    this.filteredMessages = _.sortBy(messages,
         [message => message.range ? message.range[0][0] : -1, message => message.logRange ? message.logRange[0][0] : -1])
    if (!this.view) {
      this.view = atom.workspace.addBottomPanel({
        item: this
      })
    }
    this.refs.logMessages.update({ messages: this.filteredMessages })

    for (const editor of editors) {
      if (editor.getPath()) {
        const m = _.filter(messages, message => {
          return message.filePath && message.range && editor.getPath().includes(message.filePath)
        })
        if (m.length) {
          this.errorMarkers.push(new ErrorMarker(editor, m))
        }
      }
    }
  }

  destroyErrorMarkers () {
    if (this.errorMarkers) {
      for (const errorMarker of this.errorMarkers) {
        errorMarker.clear()
      }
      this.errorMarkers = []
    }
  }

  render () {
    return <div className='am-panel tool-panel panel-bottom native-key-bindings' tabindex='-1'>
      <div className='panel-resize-handle' style='position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3' />
      <div className='panel-heading'>
        <div className='heading-title inline-block' style='cursor: pointer' onClick={() => {}} />
        <div className='heading-summary inline-block'>LaTeX Messages</div>
        <div className='heading-buttoms inline-block pull-right'>
          <div className='heading-autoScroll inline-block icon-move-down' style='cursor: pointer' onclick='toggleAutoScroll' />
          <div className='heading-fold inline-block icon-fold' style='cursor: pointer' onclick='toggleAutoScroll' />
          <div className='heading-close inline-block icon-x' style='cursor: pointer' onclick='toggleAutoScroll' />
        </div>
      </div>
      <LogMessages messages={this.filteredMessages} ref='logMessages' />
    </div>
  }

  update () {
    return etch.update(this)
  }
}
