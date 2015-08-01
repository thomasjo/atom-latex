"use babel";
/** @jsx etch.dom */

import {CompositeDisposable} from "atom";
import etch from "etch";

const GUIDE_URI = "atom://latex/getting-started/guide";

etch.registerElement("latex-getting-started-guide", {
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

function createGuideView(uri) {
  const element = document.createElement("latex-getting-started-guide");
  element.initialize(uri);

  return element;
}

export default class Guide {
  subscriptions = new CompositeDisposable();

  initialize() {
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri !== GUIDE_URI) { return null; }
      return createGuideView(uri);
    }));
  }

  destroy() {
    this.subscriptions.dispose();
  }

  show() {
    atom.workspace.open(GUIDE_URI);
  }
}
