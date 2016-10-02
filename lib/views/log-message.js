/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import path from 'path'
import { Range } from 'atom'

function fileRef (filePath, range, bracket) {
  const lineRef = range ? ` at line ${range[0][0] + 1}` : ''
  const text = path.basename(filePath) + lineRef
  const content = `${bracket ? 'from' : 'in'} ${text}`
  const clickHandler = () => {
    atom.workspace.open(filePath, { initialLine: range ? range[0][0] : 0 })
  }
  const pre = bracket ? ' [' : ' '
  const post = bracket ? ']' : ''
  if (filePath) {
    return <span className='latex-file-ref'>{pre}<span className='latex-file-link' onclick={clickHandler}>{content}</span>{post}</span>
  }

  return ''
}

export default class LogMessage {
  constructor (properties) {
    this.properties = properties || {}
    etch.initialize(this)
  }

  render () {
    const message = this.properties.message

    return (
      <div className={this.getClassNames(message)}>
        <span>{message.text}</span>
        {fileRef(message.filePath, message.range, false)}
        {fileRef(message.logPath, message.logRange, true)}
      </div>
    )
  }

  getClassNames (message) {
    const className = `latex-${message.type.toLowerCase()}`

    const matchesFilePath = message.filePath && this.properties.filePath === message.filePath
    const containsPosition = message.range && this.properties.position && Range.fromObject(message.range).containsPoint(this.properties.position)
    if (matchesFilePath && containsPosition) {
      return `${className} latex-highlight`
    }

    return className
  }

  update (properties) {
    this.properties = properties || {}
    return etch.update(this)
  }
}
