"use babel";
/** @jsx etch.dom */

import etch, {observe} from "etch";
import DOMListener from "dom-listener";
import {exec} from "child_process";

export default etch.registerElement("latex-getting-started-guide", {
  initialize(uri) {
    this.uri = uri;
    return this;
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

  render() {
    return (
      <latex-getting-started-guide className="pane-item padded">
        <h1>Getting Started with LaTeX in Atom</h1>
        <section>
          <h2>Builder Configuration</h2>
          <p>
            By default <code>latexmk</code> is used to process your TeX files.
            You can change the builder in the&nbsp;
            <a ref="configLink">package configuration</a>.
          </p>

          <atom-panel className='top'>
            <div className="padded">
              <div className="inset-panel">
                <div className="panel-heading">Current Builder</div>
                <div className="panel-body padded">
                  {observe(this.model.builder, "current")}
                </div>
              </div>
            </div>
            <div className="padded">
              <div className="inset-panel">
                <div className="panel-heading">Builder Executable Found</div>
                <div className="panel-body padded">
                  {observe(this.model.builder, "executableFound")}
                </div>
              </div>
            </div>
          </atom-panel>
        </section>
      </latex-getting-started-guide>
    );
  },

  createdCallback() {
    this.model = {
      builder: {
        current: "",
        executableFound: "",
      },
    };
  },

  attachedCallback() {
    this.handleEvents();
    this.checkEverything();
  },

  detachedCallback() {
    if (this.listener) {
      // NOTE: Is this cleanup necessary?
      this.listener.destroy();
    }
  },

  handleEvents() {
    this.listener = new DOMListener(this);

    this.listener.add(this.refs.configLink, "click", () => {
      this.openSettingsView();
    });
  },

  openSettingsView() {
    atom.workspace.open("atom://config/packages");
  },

  checkEverything() {
    this.checkBuilderConfiguration();
  },

  checkBuilderConfiguration() {
    atom.config.observe("latex.builder", builder => {
      this.model.builder.current = builder;
      this.checkBuilderExecutable();
    });

    atom.config.observe("latex.texPath", texPath => {
      this.checkBuilderExecutable();
    });
  },

  checkBuilderExecutable() {
    const texPath = atom.config.get("latex.texPath");
    const executable = latex.builder.executable;
    const platform = global.process.platform;
    const command = this.constructWhichCommand(executable, platform);
    const options = latex.builder.constructChildProcessOptions();
    const process = exec(command, options, error => {
      this.model.builder.executableFound = (error == null) ? "Yes" : "No";
    });
  },

  constructWhichCommand(executable, platform) {
    const which = (platform === "win32") ? "where" : "which";
    return `${which} ${executable}`;
  },
});
