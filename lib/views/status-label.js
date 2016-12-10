/* @flow */
/** @jsx etch.dom */

import etch from 'etch'

export default class StatusLabel {
  properties: Object
  tooltip: Object
  element: Object

  constructor (properties: Object = {}) {
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
    if (!this.properties.text) return <div />

    let classNames = [
      'latex-status',
      'inline-block'
    ]

    if (this.properties.type) classNames.push(`latex-${this.properties.type}`)
    if (this.properties.onClick) classNames.push('latex-status-link')

    let iconClassNames = [
      'icon',
      `icon-${this.properties.icon}`
    ]

    if (this.properties.spin) iconClassNames.push('latex-spin')

    return (
      <div className={classNames.join(' ')} onclick={this.properties.onClick}>
        {this.properties.icon ? <div className={iconClassNames.join(' ')} /> : ''}
        <span>{this.properties.text}</span>
      </div>
    )
  }

  update (properties: Object) {
    this.properties = properties
    return etch.update(this)
  }

  readAfterUpdate () {
    if (this.tooltip) {
      this.tooltip.dispose()
      delete this.tooltip
    }
    if (this.properties.title) {
      this.tooltip = atom.tooltips.add(this.element, { title: this.properties.title })
    }
  }
}
