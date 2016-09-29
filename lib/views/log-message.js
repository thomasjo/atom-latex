/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import path from 'path'
import { Range } from 'atom'

export default class LogMessage {
  constructor (properties) {
    this.properties = properties
    etch.initialize(this)
  }

  render () {
    function fileRef (filePath, range, bracket) {
      const lineRef = range ? ` at line ${range[0][0] + 1}` : ''
      const text = path.basename(filePath) + lineRef
      const content = `${bracket ? 'from' : 'in'} ${text}`
      const clickHandler = () => {
        atom.workspace.open(filePath, { initialLine: range ? range[0][0] : 0 })
      }
      const pre = bracket ? ' [' : ' '
      const post = bracket ? ']' : ''
      return filePath
        ? <span className='latex-file-ref'>{pre}<span className='latex-file-link' onclick={clickHandler}>{content}</span>{post}</span>
        : ''
    }

    const message = this.properties.message
    const highlight = message.filePath && this.properties.filePath === message.filePath &&
      message.range && this.properties.position && Range.fromObject(message.range).containsPoint(this.properties.position)
    const className = `latex-${message.type.toLowerCase()}${highlight ? ' latex-highlight' : ''}`
    return (
      <div className={className}>
        <span>{message.text}</span>
        {fileRef(message.filePath, message.range, false)}
        {fileRef(message.logPath, message.logRange, true)}
      </div>
    )
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }
}
