import React from 'react'
import MessageCount from './message-count'

interface Props {}

interface State {
  busy: boolean
}

export default class StatusLabel extends React.Component<Props, State> {
  element: React.RefObject<HTMLDivElement> = React.createRef()
  tooltip: any

  constructor (props: Props) {
    super(props)

    this.state = {
      busy: false
    }
  }

  handleClick = async () => {
    await latex.log.show()
  }

  componentDidMount () {
    this.tooltip = atom.tooltips.add(this.element.current!, { title: 'Click to show LaTeX log' })
  }

  componentWillUnmount () {
    if (this.tooltip) {
      this.tooltip.dispose()
    }
  }

  render () {
    return (
      <div ref={this.element} className={this.getClassNames()} onClick={this.handleClick}>
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

    if (this.state.busy) {
      return `${className} is-busy`
    }

    return className
  }
}
