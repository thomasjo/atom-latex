import _ from 'lodash'
import React from 'react'
import { CompositeDisposable } from 'atom'

import MessageIcon from './message-icon'

interface Props {
  type: string
}

interface State {
  messages: any[]
}

export default class MessageCount extends React.Component<Props, State> {
  disposables = new CompositeDisposable()

  constructor (props: Props = { type: 'error' }) {
    super(props)

    this.state = {
      messages: []
    }
  }

  componentDidMount () {
    this.disposables.add(latex.log.onMessages((event: any) => {
      const messages = _.filter(event.messages, { 'type': this.props.type })

      this.setState({
        'messages': messages
      })
    }))
  }

  componentWillUnmount () {
    this.disposables.dispose()
  }

  render () {
    if (latex.log.messageTypeIsVisible(this.props.type)) {
      return (
        <span className={`latex-${this.props.type} latex-message-count`}>
          <MessageIcon type={this.props.type} />
          {this.state.messages.length}
        </span>
      )
    }

    return <span />
  }
}
