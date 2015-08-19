"use babel";

import {CompositeDisposable} from "atom";
import GuideView from "./guide-view";

const GUIDE_URI = "atom://latex/getting-started/guide";

export default class Guide {
  subscriptions = new CompositeDisposable();

  initialize() {
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri !== GUIDE_URI) { return null; }
      return new GuideView(uri);
    }));
  }

  destroy() {
    this.subscriptions.dispose();
  }

  show() {
    atom.workspace.open(GUIDE_URI);
  }
}
