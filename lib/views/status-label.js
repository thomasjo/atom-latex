/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import MessageCount from './message-count'

export default class StatusLabel {
  constructor (properties = {}) {
    this.properties = properties
    etch.initialize(this)
  }

  async destroy () {
    if (this.tooltip) {
      this.tooltip.dispose()
    }
    await etch.destroy(this)
  }

  render () {
    return (
      <div className={this.getClassNames()} onclick={() => latex.log.show()}>
        <span className='icon icon-sync busy' />
        <a href='#'>LaTeX</a>
        <MessageCount type='error' />
        <MessageCount type='warning' />
        <MessageCount type='info' />
      </div>
    )
  }

  getClassNames () {
    const className = `latex-status inline-block`

    if (this.properties.busy) {
      return `${className} is-busy`
    }

    return className
  }

  update (properties = {}) {
    Object.assign(this.properties, properties)
    return etch.update(this)
  }

  readAfterUpdate () {
    if (this.tooltip) {
      this.tooltip.dispose()
      this.tooltop = null
    }
    this.tooltip = atom.tooltips.add(this.element, { title: 'Click to show LaTeX log' })
  }
}
