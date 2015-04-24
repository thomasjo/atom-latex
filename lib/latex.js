"use babel";

const fs = require("fs-plus");

module.exports =
class Latex {
  initialize() {
    this.createLogProxy();

    Object.defineProperty(this, "builder", {
      get: function() { return this.__builder || this.setDefaultBuilder(); },
      set: function(builder) { this.__builder = builder; },
    });

    Object.defineProperty(this, "logger", {
      get: function() { return this.__logger || this.setDefaultLogger(); },
      set: function(logger) { this.__logger = logger; },
    });

    Object.defineProperty(this, "opener", {
      get: function() { return this.__opener || this.setDefaultOpener(); },
      set: function(opener) { this.__opener = opener; },
    });
  }

  getBuilder() { return this.builder; }
  getLogger() { return this.logger; }
  getOpener() { return this.opener; }

  setLogger(logger) {
    this.logger = logger;
  }

  setDefaultBuilder() {
    const LatexmkBuilder = require("./builders/latexmk");
    return this.__builder = new LatexmkBuilder();
  }

  setDefaultLogger() {
    const ConsoleLogger = require("./loggers/console-logger");
    return this.__logger = new ConsoleLogger();
  }

  setDefaultOpener() {
    const OpenerImpl = this.resolveOpenerImplementation(process.platform);
    if (OpenerImpl) {
      return this.__opener = new OpenerImpl();
    }

    if (this.__logger && this.log) {
      this.log.warning(`
        No PDF opener found.
        For cross-platform viewing, consider installing the pdf-view package.
        `
      );
    }
  }

  createLogProxy() {
    this.log = {
      error: (statusCode, result, builder) => { this.logger.error(statusCode, result, builder); },
      warning: (message) => { this.logger.warning(message); },
      info: (message) => { this.logger.info(message); },
    };
  }

  resolveOpenerImplementation(platform) {
    let OpenerImpl;

    switch (platform) {
      case "darwin":
        if (fs.existsSync(atom.config.get("latex.skimPath"))) {
          OpenerImpl = require("./openers/skim-opener");
          break;
        }

        OpenerImpl = require("./openers/preview-opener");
        break;

      case "win32":
        if (fs.existsSync(atom.config.get("latex.sumatraPath"))) {
          OpenerImpl = require("./openers/sumatra-opener");
          break;
        }
    }

    if (!OpenerImpl && atom.packages.resolvePackagePath("pdf-view")) {
      OpenerImpl = require("./openers/atompdf-opener");
    }

    return OpenerImpl;
  }
};
