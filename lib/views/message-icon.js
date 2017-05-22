/** @babel */
/** @jsx etch.dom */

import etch from 'etch'

export default class MessageIcon {
  static icons = {
    error: 'stop',
    warning: 'alert',
    info: 'info'
  }

  constructor (properties = { type: 'error' }) {
    this.properties = properties
    etch.initialize(this)
  }

  async destroy () {
    await etch.destroy(this)
  }

  render () {
    return (
      <span className={`icon icon-${MessageIcon.icons[this.properties.type]}`} />
    )
  }

  update (properties) {
    this.properties = properties
    return etch.update(this)
  }
}
