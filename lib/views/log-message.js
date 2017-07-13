/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { Range } from 'atom'
import MessageIcon from './message-icon'
import FileReference from './file-reference'

export default class LogMessage {
  constructor (properties = {}) {
    this.properties = properties
    etch.initialize(this)
  }

  async destroy () {
    await etch.destroy(this)
  }

  render () {
    const message = this.properties.message
    const lines = message.text.split('\n').map(line => (<div>{line}</div>))

    return (
      <tr className={this.getClassNames(message)}>
        <td><MessageIcon type={message.type} /></td>
        <td>{lines}</td>
        <td><FileReference file={message.filePath} range={message.range} /></td>
        <td><FileReference file={message.logPath} range={message.logRange} /></td>
      </tr>
    )
  }

  getClassNames (message) {
    const className = `latex-${message.type}`

    const matchesFilePath = message.filePath && this.properties.filePath === message.filePath
    const containsPosition = message.range && this.properties.position && Range.fromObject(message.range).containsPoint(this.properties.position)
    if (matchesFilePath && containsPosition) {
      return `${className} latex-highlight`
    }

    return className
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }
}
