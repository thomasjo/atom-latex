/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import path from 'path'
import { Range } from 'atom'

function fileReferenceElement (filePath, range, referenceType) {
  if (!filePath) return ''

  const lineReference = range ? <span className='latex-line-number'>{range[0][0] + 1}</span> : ''
  const endLineReference = (range && range[0][0] !== range[1][0]) ? <span className='latex-end-line-number'>{range[1][0] + 1}</span> : ''
  const text = path.basename(filePath)
  const clickHandler = () => {
    atom.workspace.open(filePath, { initialLine: range ? range[0][0] : 0 })
  }
  const className = `latex-${referenceType}-reference`

  return (
    <span className={className}>
      <span className='latex-file-link' onclick={clickHandler}>
        {text}
        {lineReference}
        {endLineReference}
      </span>
    </span>
  )
}

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

    return (
      <div className={this.getClassNames(message)}>
        <span>{message.text}</span>
        {fileReferenceElement(message.filePath, message.range, 'source')}
        {fileReferenceElement(message.logPath, message.logRange, 'log')}
      </div>
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
