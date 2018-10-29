import _ from 'lodash'
import React from 'react'
import { CompositeDisposable } from 'atom'

import LogMessage from './log-message'

interface Props {
  filePath: string
  position: any
}

interface State {
  messages: any[]
}

export default class LogDock extends React.Component<Props, State> {
  static LOG_DOCK_URI = 'atom://latex/log'

  disposables = new CompositeDisposable()

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
      <div className='latex-log'>
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

  // readAfterUpdate () {
  //   // Look for highlighted messages and scroll to them
  //   const highlighted = this.refs.body.getElementsByClassName('latex-highlight')
  //   if (highlighted.length) {
  //     highlighted[0].scrollIntoView()
  //   }
  // }

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
