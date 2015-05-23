"use babel";

import _ from "lodash";

class ErrorIndicatorView extends HTMLElement {
  model = null;

  createdCallback() {
    this.classList.add("inline-block");

    const messageElement = document.createElement("a");
    this.appendChild(messageElement);
    messageElement.innerText = "LaTeX compilation error";
    messageElement.addEventListener("click", () => { this.openLogFile(); });
  }

  initialize(model) {
    this.setModel(model);
  }

  setModel(model) {
    this.model = model;
  }

  openLogFile() {
    if (!this.model) { return; }

    atom.workspace.open(this.model.logFilePath).then(editor => {
      const position = this.getFirstErrorPosition();
      editor.scrollToBufferPosition(position, {center: true});
    });
  }

  getFirstErrorPosition() {
    const position = _.first(_.pluck(this.model.errors, "logPosition"));
    return position || [0, 0];
  }
}

export default document.registerElement("latex-error-indicator", {
  prototype: ErrorIndicatorView.prototype,
});
