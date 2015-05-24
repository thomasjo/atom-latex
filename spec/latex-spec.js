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
      spyOn(latex, "skimExecutableExists").andReturn(true);
      const opener = latex.resolveOpenerImplementation("darwin");

      expect(opener.name).toBe("SkimOpener");
    });

    it("returns PreviewOpener when Skim is not installed, and running on OS X", function() {
      spyOn(latex, "skimExecutableExists").andReturn(false);
      const opener = latex.resolveOpenerImplementation("darwin");

      expect(opener.name).toBe("PreviewOpener");
    });

    it("returns SumatraOpener when installed, and running on Windows", function() {
      spyOn(latex, "sumatraExecutableExists").andReturn(true);
      const opener = latex.resolveOpenerImplementation("win32");

      expect(opener.name).toBe("SumatraOpener");
    });

    it("returns AtomPdfOpener as a fallback, if the pdf-view package is installed", function() {
      spyOn(latex, "hasPdfViewerPackage").andReturn(true);
      const opener = latex.resolveOpenerImplementation("foo");

      expect(opener.name).toBe("AtomPdfOpener");
    });

    it("always returns AtomPdfOpener if alwaysOpenResultInAtom is enabled and pdf-view is installed", function() {
      spyOn(latex, "hasPdfViewerPackage").andReturn(true);
      spyOn(latex, "shouldOpenResultInAtom").andReturn(true);
      spyOn(latex, "skimExecutableExists").andCallThrough();

      const opener = latex.resolveOpenerImplementation("darwin");

      expect(opener.name).toBe("AtomPdfOpener");
      expect(latex.skimExecutableExists).not.toHaveBeenCalled();
    });

    it("does not support GNU/Linux", function() {
      spyOn(latex, "hasPdfViewerPackage").andReturn(false);
      const opener = latex.resolveOpenerImplementation("linux");

      expect(opener).toBeNull();
    });

    it("does not support unknown operating systems without pdf-view package", function() {
      spyOn(latex, "hasPdfViewerPackage").andReturn(false);
      const opener = latex.resolveOpenerImplementation("foo");

      expect(opener).toBeNull();
    });
  });
});
