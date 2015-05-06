"use babel";

function createSpan(html, ...classes) {
  const span = document.createElement("span");
  span.innerHTML = html;
  span.className = classes.join(" ");

  return span;
}

class ProgressIndicatorView extends HTMLElement {
  createdCallback() {
    this.classList.add("inline-block");

    this.appendChild(createSpan("Compiling TeX file", "inline-block"));
    this.appendChild(createSpan(".", "dot", "one"));
    this.appendChild(createSpan(".", "dot", "two"));
    this.appendChild(createSpan(".", "dot", "three"));
  }
}

export default document.registerElement("latex-progress-indicator", {
  prototype: ProgressIndicatorView.prototype,
});
