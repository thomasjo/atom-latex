"use babel";

const {View} = require("space-pen");

module.exports =
class ProgressIndicatorView extends View {
  static content() {
    return this.div(
      {class: "latex-progress-indicator inline-block"},
      () => {
        this.span("Compiling TeX file");
        this.span({class: "dot one"}, ".");
        this.span({class: "dot two"}, ".");
        this.span({class: "dot three"}, ".");
      },
    );
  }

  destroy() {
    this.remove();
  }
};
