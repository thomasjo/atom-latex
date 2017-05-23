/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { CompositeDisposable } from 'atom'
import MessageIcon from './message-icon'

export default class LoggingLevelButton {
  disposables = new CompositeDisposable()

  constructor (properties = { type: 'error' }) {
    this.properties = properties
    etch.initialize(this)
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', () => this.update()))
  }

  async destroy () {
    await etch.destroy(this)
    this.disposables.dispose()
  }

  render () {
    const type = this.properties.type
    const loggingLevel = atom.config.get('latex.loggingLevel')
    const onclick = () => atom.config.set('latex.loggingLevel', type)
    const classes = ['btn', 'icon', `icon-${MessageIcon.icons[type]}`, `latex-${type}`]
    const title = `${type} logging level`

    if (loggingLevel === type) classes.push('selected')

    return (
      <button className={classes.join(' ')} title={title} onclick={onclick} tabindex='-1' />
    )
  }

  update (properties = {}) {
    Object.assign(this.properties, properties)
    return etch.update(this)
  }
}
