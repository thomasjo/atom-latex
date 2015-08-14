"use babel";
/** @jsx etch.dom */

import _ from "lodash";
import etch from "etch";

export default etch.defineElement("div", {
  model: null,

  render() {
    return (
      <div className="latex-error-indicator inline-block">
        <a>LaTeX compilation error</a>
      </div>
    );
  },

  attachedCallback() {
    this.subscribeToEvents();
  },

  initialize(model) {
    this.setModel(model);
  },

  setModel(model) {
    this.model = model;
  },

  subscribeToEvents() {
    const clickHandler = () => this.openLogFile();
    this.querySelector("a").addEventListener("click", clickHandler);
  },

  openLogFile() {
    if (!this.model) { return; }

    atom.workspace.open(this.model.logFilePath).then(editor => {
      const position = this.getFirstErrorPosition();
      editor.scrollToBufferPosition(position, {center: true});
    });
  },

  getFirstErrorPosition() {
    const position = _.first(_.pluck(this.model.errors, "logPosition"));
    return position || [0, 0];
  },
});
