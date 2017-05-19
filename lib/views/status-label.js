/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
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
    const classes = ['latex-status', 'inline-block']

    if (this.properties.busy) classes.push('is-busy')

    return (
      <div className={classes.join(' ')} onclick={() => latex.log.show()}>
        <span className='icon icon-sync busy' />
        <a href='#'>LaTeX</a>
        <MessageCount type='error' />
        <MessageCount type='warning' />
        <MessageCount type='info' />
      </div>
    )
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
