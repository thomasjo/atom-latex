import React from 'react'

interface Props {
  type: string
}

export default class MessageIcon extends React.Component<Props, {}> {
  static icons: { [key: string]: string } = {
    error: 'stop',
    warning: 'alert',
    info: 'info'
  }

  constructor (props: Props) {
    super(props)
  }

  render () {
    return (
      <span className={`icon icon-${MessageIcon.icons[this.props.type]}`} />
    )
  }
}
