"use babel";

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
    atom.workspace.open(this.model.logFilePath);
  }

  openDevConsole() {
    atom.openDevTools();
    atom.executeJavaScriptInDevTools("InspectorFrontendAPI.showConsole()");
  }
}

export default document.registerElement("latex-error-indicator", {
  prototype: ErrorIndicatorView.prototype,
});
