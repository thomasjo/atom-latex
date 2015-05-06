"use babel";

class ErrorIndicatorView extends HTMLElement {
  createdCallback() {
    this.classList.add("inline-block");

    const messageElement = document.createElement("a");
    this.appendChild(messageElement);
    messageElement.innerText = "LaTeX compilation error";
    messageElement.addEventListener("click", () => { this.openDevConsole(); });
  }

  openDevConsole() {
    atom.openDevTools();
    atom.executeJavaScriptInDevTools("InspectorFrontendAPI.showConsole()");
  }
}

export default document.registerElement("latex-error-indicator", {
  prototype: ErrorIndicatorView.prototype,
});
