import { Range } from "atom";
import React from "react";

import FileReference from "./file-reference";
import MessageIcon from "./message-icon";

interface Props {
  message: any;
  filePath?: string;
  position?: any;
}

export default class LogMessage extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  public render() {
    const message = this.props.message;
    const lines = message.text.split("\n").map((line: string) => (<div>{line}</div>));

    return (
      <tr className={this.getClassNames(message)}>
        <td><MessageIcon type={message.type} /></td>
        <td>{lines}</td>
        <td><FileReference file={message.filePath} range={message.range} /></td>
        <td><FileReference file={message.logPath} range={message.logRange} /></td>
      </tr>
    );
  }

  public getClassNames(message: any) {
    const className = `latex-${message.type}`;

    const matchesFilePath = message.filePath && this.props.filePath === message.filePath;
    const containsPosition =
      message.range &&
      this.props.position &&
      Range.fromObject(message.range).containsPoint(this.props.position);
    if (matchesFilePath && containsPosition) {
      return `${className} latex-highlight`;
    }

    return className;
  }
}
