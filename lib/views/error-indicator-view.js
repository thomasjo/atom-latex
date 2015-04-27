"use babel";

const {View} = require("space-pen");

module.exports =
class ErrorIndicatorView extends View {
  static content() {
    return this.div(
      {class: "latex-error-indicator inline-block"},
      () => this.a({click: "openDevConsole"}, "LaTeX compilation error"),
    );
  }

  destroy() {
    this.remove();
  }

  openDevConsole() {
    atom.openDevTools();
    atom.executeJavaScriptInDevTools("InspectorFrontendAPI.showConsole()");
  }
};
