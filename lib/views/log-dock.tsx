import _ from 'lodash'
import React from 'react'
import { CompositeDisposable, ViewModel } from 'atom'

import LogMessage from './log-message'

interface Props {
  filePath: string
  position: any
}

interface State {
  messages: any[]
}

export default class LogDock extends React.Component<Props, State> implements ViewModel {
  static LOG_DOCK_URI = 'atom://latex/log'

  disposables = new CompositeDisposable()
  element: React.RefObject<HTMLDivElement> = React.createRef()

  constructor (props: Props) {
    super(props)

    this.state = {
      messages: []
    }
  }

  componentDidMount () {
    this.disposables.add(latex.log.onMessages((event: any) => {
      this.setState({
        messages: event.messages
      })
    }))
  }

  render () {
    let index = 0
    let content = this.state.messages.map(message => {
      return (
        <LogMessage
          key={index++}
          message={message}
          filePath={this.props.filePath}
          position={this.props.position}
        />
      )
    })

    return (
      <div ref={this.element} className='latex-log'>
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

  getTitle () {
    return 'LaTeX Log'
  }

  getURI () {
    return LogDock.LOG_DOCK_URI
  }

  getDefaultLocation () {
    return 'bottom'
  }

  getElement () {
    return this.element.current
  }

  serialize () {
    return {
      deserializer: 'latex/log'
    }
  }
}
