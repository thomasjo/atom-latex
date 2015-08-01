"use babel";
/** @jsx etch.dom */

import etch from "etch";

export default etch.registerElement("latex-getting-started-guide", {
  initialize(uri) {
    this.uri = uri;
  },

  render() {
    return (
      <latex-getting-started-guide className="pane-item padded">
        <h1>Getting Started</h1>
        <p>...</p>
      </latex-getting-started-guide>
    );
  },

  getURI() {
    return this.uri;
  },

  getTitle() {
    return "Getting Started";
  },

  getIconName() {
    return "checklist";
  },
});
