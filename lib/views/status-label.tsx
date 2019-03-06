import React from "react";

import MessageCount from "./message-count";

interface State {
  busy: boolean;
}

export default class StatusLabel extends React.Component<{}, State> {
  public element: React.RefObject<HTMLDivElement> = React.createRef();
  public tooltip: any;

  constructor(props: {}) {
    super(props);

    this.state = {
      busy: false,
    };
  }

  public handleClick = async () => {
    await latex.log.show();
  }

  public componentDidMount() {
    this.tooltip = atom.tooltips.add(this.element.current!, { title: "Click to show LaTeX log" });
  }

  public componentWillUnmount() {
    if (this.tooltip) {
      this.tooltip.dispose();
    }
  }

  public render() {
    return (
      <div ref={this.element} className={this.getClassNames()} onClick={this.handleClick}>
        <span className="icon icon-sync busy" />
        <a href="#">LaTeX</a>
        <MessageCount type="error" />
        <MessageCount type="warning" />
        <MessageCount type="info" />
      </div>
    );
  }

  public getClassNames() {
    const className = `latex-status inline-block`;

    if (this.state.busy) {
      return `${className} is-busy`;
    }

    return className;
  }

  public getElement() {
    return this.element.current;
  }
}
