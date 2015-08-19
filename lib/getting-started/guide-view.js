"use babel";
/** @jsx etch.dom */

import etch from "etch";

import {CompositeDisposable} from "atom";
import {exec} from "child_process";
import DOMListener from "dom-listener";

export default class GuideView {
  constructor(uri) {
    this.uri = uri;
    this.model = {
      builder: [],
    };

    etch.createElement(this);
    this.subscriptions = new CompositeDisposable();
    this.handleEvents();
    this.checkEverything();
  }

  getURI() {
    return this.uri;
  }

  getTitle() {
    return "Getting Started";
  }

  getIconName() {
    return "checklist";
  }

  render() {
    return (
      <div className="latex-getting-started-guide pane-item padded">
        <h1>Getting Started with LaTeX in Atom</h1>
        <section>
          <h2>Builder Configuration</h2>
          <p>
            By default <code>latexmk</code> is used to process your TeX files.
            You can change the builder in the&nbsp;
            <a ref="configLink">package configuration</a>.
          </p>

          <table>{
            this.model.builder.map(check =>
              <tr className={check.status}>
                <td className="icon"></td>
                <td>{check.title}</td>
                <td>{check.detail}</td>
              </tr>
            )
          }</table>
        </section>
      </div>
    );
  }

  update() {
    etch.updateElement(this);
  }

  destroy() {
    if (this.listener) {
      this.listener.destroy();
    }
  }

  handleEvents() {
    this.listener = new DOMListener(this.element);

    this.listener.add(this.refs.configLink, "click", () => {
      this.openSettingsView();
    });
  }

  openSettingsView() {
    atom.workspace.open("atom://config/packages/latex");
  }

  checkEverything() {
    this.checkBuilderConfiguration();
  }

  checkBuilderConfiguration() {
    const current = {
      title: "Current Builder",
      status: "info",
      detail: "",
    };

    const executable = {
      title: "Executable Found",
      status: "info",
      detail: "",
    };

    this.model.builder.push(current);
    this.model.builder.push(executable);

    this.subscriptions.add(atom.config.observe("latex.builder", builder => {
      current.status = "info";
      current.detail = builder;

      this.update();
      this.checkBuilderExecutable(executable);
    }));

    this.subscriptions.add(atom.config.observe("latex.texPath", texPath => {
      this.checkBuilderExecutable(executable);
    }));
  }

  checkBuilderExecutable(checker) {
    const texPath = atom.config.get("latex.texPath");
    const executable = latex.builder.executable;
    const platform = global.process.platform;
    const command = this.constructWhichCommand(executable, platform);
    const options = latex.builder.constructChildProcessOptions();

    const process = exec(command, options, error => {
      const found = error == null;
      checker.status = found ? "success" : "error";
      checker.detail = found ? "OK!" : "Executable not found!";

      this.update();
    });
  }

  constructWhichCommand(executable, platform) {
    const which = (platform === "win32") ? "where" : "which";
    return `${which} ${executable}`;
  }
}
