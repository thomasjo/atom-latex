/** @babel */
/** @jsx etch.dom */

import _ from 'lodash'
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
  constructor (properties = {}) {
    this.properties = properties
    etch.initialize(this)
    latex.log.on('messages', () => this.update({}))
  }

  async destroy () {
    if (this.tooltip) {
      this.tooltip.dispose()
    }
    await etch.destroy(this)
  }

  render () {
    const messages = latex.log.getMessages()
    const counts = _.countBy(messages, 'type')
    const loggingLevel = atom.config.get('latex.loggingLevel')

    return (
      <div className='latex-status inline-block' onclick={() => latex.log.show()}>
        LaTeX
        {loggingLevel === 'info' ? renderMessageCount(counts, 'info', 'info') : ''}
        {loggingLevel !== 'error' ? renderMessageCount(counts, 'warning', 'alert') : ''}
        {renderMessageCount(counts, 'error', 'stop')}
      </div>
    )
  }

  update (properties) {
    this.properties = properties
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
