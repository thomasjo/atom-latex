/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import path from 'path'
import { Range } from 'atom'

function fileReferenceElement (filePath, range, referenceType) {
  const lineReference = range ? ` at line ${range[0][0] + 1}` : ''
  const text = path.basename(filePath) + lineReference
  const clickHandler = () => {
    atom.workspace.open(filePath, { initialLine: range ? range[0][0] : 0 })
  }
  const className = `latex-${referenceType}-reference`

  if (filePath) {
    return <span className={className}><span className='latex-file-link' onclick={clickHandler}>{text}</span></span>
  }

  return ''
}

export default class LogMessage {
  constructor (properties = {}) {
    this.properties = properties
    etch.initialize(this)
  }

  render () {
    const message = this.properties.message

    return (
      <div className={this.getClassNames(message)}>
        <span>{message.text}</span>
        {fileReferenceElement(message.filePath, message.range, 'source')}
        {fileReferenceElement(message.logPath, message.logRange, 'log')}
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
    this.properties = properties
    return etch.update(this)
  }
}
