import { Disposable } from "atom";
import React from "react";
import ReactDOM from "react-dom";

import StatusLabel from "./views/status-label";

export default class StatusIndicator extends Disposable {
  public container?: HTMLDivElement;
  public statusLabel?: StatusLabel;
  public statusTile?: any;

  constructor() {
    super(() => this.detachStatusBar());
  }

  public attachStatusBar(statusBar: any) {
    this.container = document.createElement("div");
    this.statusLabel = ReactDOM.render(React.createElement(StatusLabel), this.container);

    this.statusTile = statusBar.addLeftTile({
      item: this.statusLabel,
      priority: 9001,
    });
  }

  public detachStatusBar() {
    if (this.statusTile) {
      this.statusTile.destroy();
      this.statusTile = undefined;
    }
    if (this.container && this.statusLabel) {
      ReactDOM.unmountComponentAtNode(this.container);
      this.statusLabel = undefined;
    }
  }

  public setBusy() {
    if (this.statusLabel) {
      this.statusLabel.setState({ busy: true });
    }
  }

  public setIdle() {
    if (this.statusLabel) {
      this.statusLabel.setState({ busy: false });
    }
  }

  public show() {
    if (this.statusLabel) {
      this.statusLabel.setState({ busy: false });
    }
  }
}
