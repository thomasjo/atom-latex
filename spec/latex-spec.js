"use babel";

import "./spec-helpers";
import fs from "fs-plus";
import Latex from "../lib/latex";
import {NullOpener} from "./stubs";

describe("Latex", function() {
  let latex, globalLatex;

  beforeEach(function() {
    globalLatex = global.latex;
    delete global.latex;
    latex = new Latex();
  });

  afterEach(function() {
    global.latex = globalLatex;
  });

  describe("initialize", function() {
    it("initializes all properties", function() {
      spyOn(latex, "resolveOpenerImplementation").andReturn(NullOpener);

      expect(latex.builder).toBeDefined();
      expect(latex.logger).toBeDefined();
      expect(latex.opener).toBeDefined();
    });
  });

  describe("getDefaultBuilder", function() {
    it("returns an instance of LatexmkBuilder", function() {
      const defaultBuilder = latex.getDefaultBuilder();

      expect(defaultBuilder.constructor.name).toBe("LatexmkBuilder");
    });
  });

  describe("getDefaultLogger", function() {
    it("returns an instance of ConsoleLogger", function() {
      const defaultLogger = latex.getDefaultLogger();

      expect(defaultLogger.constructor.name).toBe("ConsoleLogger");
    });
  });

  describe("getDefaultOpener", function() {
    it("returns an instance of a resolved implementation of Opener", function() {
      spyOn(latex, "resolveOpenerImplementation").andReturn(NullOpener);
      const defaultOpener = latex.getDefaultOpener();

      expect(defaultOpener.constructor.name).toBe(NullOpener.name);
    });
  });

  describe("Logger proxy", function() {
    let logger;

    beforeEach(function() {
      logger = jasmine.createSpyObj("MockLogger", ["error", "warning", "info"]);
      latex.setLogger(logger);
      latex.createLogProxy();
    });

    it("correctly proxies error to error", function() {
      const statusCode = 0;
      const result = {foo: "bar"};
      const builder = {run() { return ""; }};
      latex.log.error(statusCode, result, builder);

      expect(logger.error).toHaveBeenCalledWith(statusCode, result, builder);
    });

    it("correctly proxies warning to warning", function() {
      const message = "foo";
      latex.log.warning(message);

      expect(logger.warning).toHaveBeenCalledWith(message);
    });

    it("correctly proxies info to info", function() {
      const message = "foo";
      latex.log.info(message);

      expect(logger.info).toHaveBeenCalledWith(message);
    });
  });

  describe("resolveOpenerImplementation", function() {
    it("returns SkimOpener when installed, and running on OS X", function() {
      atom.config.set("latex.skimPath", "/Applications/Skim.app");

      const existsSync = fs.existsSync;
      spyOn(fs, "existsSync").andCallFake(filePath => {
        if (filePath === "/Applications/Skim.app") { return true; }
        return existsSync(filePath);
      });

      const opener = latex.resolveOpenerImplementation("darwin");

      expect(opener.name).toBe("SkimOpener");
    });

    it("returns PreviewOpener when Skim is not installed, and running on OS X", function() {
      atom.config.set("latex.skimPath", "/foo/Skim.app");
      const opener = latex.resolveOpenerImplementation("darwin");

      expect(opener.name).toBe("PreviewOpener");
    });

    it("returns SumatraOpener when installed, and running on Windows", function() {
      atom.config.set("latex.sumatraPath", "c:\\foo.exe");

      const existsSync = fs.existsSync;
      spyOn(fs, "existsSync").andCallFake(filePath => {
        if (filePath === "c:\\foo.exe") { return true; }
        return existsSync(filePath);
      });

      const opener = latex.resolveOpenerImplementation("win32");

      expect(opener.name).toBe("SumatraOpener");
    });

    it("returns AtomPdfOpener as a fallback, if the pdf-view package is installed", function() {
      const resolvePackagePath = atom.packages.resolvePackagePath;
      atom.packages.resolvePackagePath.andCallFake(name => {
        if (name === "pdf-view") { return true; }
        return resolvePackagePath(name);
      });

      const opener = latex.resolveOpenerImplementation("foo");

      expect(opener.name).toBe("AtomPdfOpener");
    });

    it("does not support GNU/Linux", function() {
      const opener = latex.resolveOpenerImplementation("linux");
      expect(opener).toBeUndefined();
    });

    it("does not support unknown operating systems", function() {
      const opener = latex.resolveOpenerImplementation("foo");
      expect(opener).toBeUndefined();
    });
  });
});
