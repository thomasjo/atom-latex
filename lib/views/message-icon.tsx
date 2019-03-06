import React from "react";

interface Props {
  type: string;
}

export default class MessageIcon extends React.Component<Props, {}> {
  public static icons: { [key: string]: string } = {
    error: "stop",
    info: "info",
    warning: "alert",
  };

  constructor(props: Props) {
    super(props);
  }

  public render() {
    return (
      <span className={`icon icon-${MessageIcon.icons[this.props.type]}`} />
    );
  }
}
