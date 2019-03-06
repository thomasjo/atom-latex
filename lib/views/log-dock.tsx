import { CompositeDisposable, ViewModel } from "atom";
import _ from "lodash";
import React from "react";

import LogMessage from "./log-message";

interface Props {
  filePath: string;
  position: any;
}

interface State {
  messages: any[];
}

export default class LogDock extends React.Component<Props, State> implements ViewModel {
  public static LOG_DOCK_URI = "atom://latex/log";

  public disposables = new CompositeDisposable();
  public element: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: Props) {
    super(props);

    this.state = {
      messages: [],
    };
  }

  public componentDidMount() {
    this.disposables.add(latex.log.onMessages((event: any) => {
      this.setState({
        messages: event.messages,
      });
    }));
  }

  public render() {
    let index = 0;
    const content = this.state.messages.map((message) => {
      return (
        <LogMessage
          key={index++}
          message={message}
          filePath={this.props.filePath}
          position={this.props.position}
        />
      );
    });

    return (
      <div ref={this.element} className="latex-log">
        <div className="log-block expand">
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
    );
  }

  public getTitle() {
    return "LaTeX Log";
  }

  public getURI() {
    return LogDock.LOG_DOCK_URI;
  }

  public getDefaultLocation() {
    return "bottom";
  }

  public getElement() {
    return this.element.current;
  }

  public serialize() {
    return {
      deserializer: "latex/log",
    };
  }
}
