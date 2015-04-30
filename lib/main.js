"use babel";

import ConfigSchema from "./config-schema";

module.exports = {
  config: ConfigSchema,

  activate() {
    this.commands = atom.commands.add("atom-workspace", {
      "latex:build": () => {
        this.bootstrap();
        this.composer.build();
      },
      "latex:sync": () => {
        this.bootstrap();
        this.composer.sync();
      },
      "latex:clean": () => {
        this.bootstrap();
        this.composer.clean();
      },
    });
  },

  deactivate() {
    if (this.commands) {
      this.commands.dispose();
    }

    if (this.composer) {
      this.composer.destroy();
      this.composer = null;
    }
  },

  consumeStatusBar(statusBar) {
    this.bootstrap();
    this.composer.setStatusBar(statusBar);
  },

  bootstrap() {
    if (this.bootstrapped) { return; }

    const Latex = require("./latex");
    const Composer = require("./composer");

    global.latex = new Latex();
    this.composer = new Composer();
    this.bootstrapped = true;
  },
};
