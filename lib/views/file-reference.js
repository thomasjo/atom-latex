/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import path from 'path'

export default class FileReference {
  constructor (properties = { type: 'error' }) {
    this.properties = properties
    etch.initialize(this)
  }

  async destroy () {
    await etch.destroy(this)
  }

  render () {
    const { file, range } = this.properties

    if (!file) return <span />

    const endLineReference = (range && range[0][0] !== range[1][0]) ? `\u2013${range[1][0] + 1}` : ''
    const lineReference = range ? ` (${range[0][0] + 1}${endLineReference})` : ''
    const text = path.basename(file)
    const clickHandler = () => {
      atom.workspace.open(file, { initialLine: range ? range[0][0] : 0 })
    }

    return (
      <a className='latex-file-reference' href='#' onclick={clickHandler}>
        {text}
        {lineReference}
      </a>
    )
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }
}
