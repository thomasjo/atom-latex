/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { CompositeDisposable } from 'atom'
import LogMessage from './log-message'

export default class LogDock {
  static LOG_DOCK_URI = 'atom://latex/log'

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
    let content = latex.log.getMessages().map(message => <LogMessage message={message} filePath={this.properties.filePath} position={this.properties.position} />)

    return (
      <div className='latex-log' ref='body'>
        <div className='log-block expand'>
          <table>
            <thead>
              <tr>
                <th />
                <th>Message</th>
                <th>Source&nbsp;File</th>
                <th>Log&nbsp;File</th>
              </tr>
            </thead>
            <tbody>{content}</tbody>
          </table>
        </div>
      </div>
    )
  }

  update (properties = {}) {
    this.properties = properties
    return etch.update(this)
  }

  readAfterUpdate () {
    // Look for highlighted messages and scroll to them
    const highlighted = this.refs.body.getElementsByClassName('latex-highlight')
    if (highlighted.length) {
      highlighted[0].scrollIntoView()
    }
  }

  getTitle () {
    return 'LaTeX Log'
  }

  getURI () {
    return LogDock.LOG_DOCK_URI
  }

  getDefaultLocation () {
    return 'bottom'
  }

  serialize () {
    return {
      deserializer: 'latex/log'
    }
  }
}
