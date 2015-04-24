"use babel";

const ConfigSchema = require("./config-schema");

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
    global.latex = new Latex();

    const Composer = require("./composer");
    this.composer = new Composer();

    this.bootstrapped = true;
  },
};
