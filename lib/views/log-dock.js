/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import LogMessage from './log-message'

export default class LogDock {
  constructor (properties = {}) {
    this.properties = properties
    etch.initialize(this)
    latex.log.on('clear', () => this.update({}))
    latex.log.on('messages', () => this.update({}))
  }

  async destroy () {
    await etch.destroy(this)
  }

  render () {
    let content = latex.log.getMessages().map(message => <LogMessage message={message} />)

    return (
      <div className='latex-log'>
        {content}
      </div>
    )
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }

  getTitle () {
    return 'LaTeX Log'
  }

  getURI () {
    return 'atom://latex/log'
  }

  getDefaultLocation () {
    return 'bottom'
  }
}
