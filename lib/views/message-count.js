/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { CompositeDisposable } from 'atom'
import MessageIcon from './message-icon'

export default class MessageCount {
  disposables = new CompositeDisposable()

  constructor (properties = { type: 'error' }) {
    this.properties = properties
    etch.initialize(this)
    this.disposables.add(latex.log.onMessages(() => this.update()))
  }

  async destroy () {
    await etch.destroy(this)
    this.disposables.dispose()
  }

  render () {
    const loggingLevel = atom.config.get('latex.loggingLevel')

    if ((loggingLevel === 'error' && this.properties.type !== 'error') ||
      (loggingLevel === 'warning' && this.properties.type === 'info')) {
      return <span />
    }

    const counts = latex.log.getMessages().reduce((total, message) => message.type === this.properties.type ? total + 1 : total, 0)

    return (
      <span className={`latex-${this.properties.type} latex-message-count`}>
        <MessageIcon type={this.properties.type} />
        {counts}
      </span>
    )
  }

  update (properties = {}) {
    Object.assign(this.properties, properties)
    return etch.update(this)
  }
}
