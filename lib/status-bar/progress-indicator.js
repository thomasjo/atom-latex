"use babel";
/** @jsx etch.dom */

import etch from "etch";

export default etch.registerElement("latex-progress-indicator", {
  render() {
    return (
      <latex-progress-indicator className="inline-block">
        <span className="inline-block">Compiling TeX file</span>
        <span className="dot one">.</span>
        <span className="dot two">.</span>
        <span className="dot three">.</span>
      </latex-progress-indicator>
    );
  },
});
