/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
import { CompositeDisposable } from 'atom'
import etch from 'etch'

function renderMessageCount (counts, type, icon) {
  return (
    <span className={`latex-${type} latex-message-count`}>
      <span className={`icon icon-${icon}`} />
      {counts[type] || 0}
    </span>
  )
}

export default class StatusLabel {
  disposables = new CompositeDisposable()

  constructor (properties = {}) {
    this.properties = properties
    etch.initialize(this)
    this.disposables.add(latex.log.onMessages(() => this.update()))
  }

  async destroy () {
    this.disposables.dispose()
    await etch.destroy(this)
  }

  render () {
    const messages = latex.log.getMessages()
    const counts = _.countBy(messages, 'type')
    const loggingLevel = atom.config.get('latex.loggingLevel')
    const classes = ['latex-status', 'inline-block']

    if (this.properties.busy) classes.push('is-busy')

    return (
      <div className={classes.join(' ')} onclick={() => latex.log.show()}>
        <span className='icon icon-sync busy' />
        LaTeX
        {renderMessageCount(counts, 'error', 'stop')}
        {loggingLevel !== 'error' ? renderMessageCount(counts, 'warning', 'alert') : ''}
        {loggingLevel === 'info' ? renderMessageCount(counts, 'info', 'info') : ''}
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
    this.disposables.add(this.tooltip)
  }
}
