"use babel";

import helpers from "../spec-helpers";
import path from "path";
import LatexmkBuilder from "../../lib/builders/latexmk";

describe("LatexmkBuilder", function() {
  let builder, fixturesPath, filePath, logFilePath;

  beforeEach(function() {
    builder = new LatexmkBuilder();
    fixturesPath = helpers.cloneFixtures();
    filePath = path.join(fixturesPath, "file.tex");
    logFilePath = path.join(fixturesPath, "file.log");
  });

  describe("constructArgs", function() {
    it("produces default arguments when package has default config values", function() {
      const expectedArgs = [
        "-interaction=nonstopmode",
        "-f",
        "-cd",
        "-pdf",
        "-synctex=1",
        "-file-line-error",
        `"${filePath}"`,
      ];
      const args = builder.constructArgs(filePath);

      expect(args).toEqual(expectedArgs);
    });

    it("adds -shell-escape flag when package config value is set", function() {
      helpers.spyOnConfig("latex.enableShellEscape", true);
      expect(builder.constructArgs(filePath)).toContain("-shell-escape");
    });

    it("adds -outdir=<path> argument according to package config", function() {
      const outdir = "bar";
      const expectedArg = `-outdir="${path.join(fixturesPath, outdir)}"`;
      helpers.spyOnConfig("latex.outputDirectory", outdir);

      expect(builder.constructArgs(filePath)).toContain(expectedArg);
    });

    it("adds engine argument according to package config", function() {
      helpers.spyOnConfig("latex.engine", "lualatex");
      expect(builder.constructArgs(filePath)).toContain("-lualatex");
    });

    it("adds a custom engine string according to package config", function() {
      helpers.spyOnConfig("latex.customEngine", "pdflatex %O %S");
      expect(builder.constructArgs(filePath)).toContain("-pdflatex=\"pdflatex %O %S\"");
    });
  });

  describe("parseLogFile", function() {
    let logParser;

    beforeEach(function() {
      logParser = jasmine.createSpyObj("MockLogParser", ["parse"]);
      spyOn(builder, "getLogParser").andReturn(logParser);
    });

    it("resolves the associated log file path by invoking @resolveLogFilePath", function() {
      spyOn(builder, "resolveLogFilePath").andReturn("foo.log");
      builder.parseLogFile(filePath);

      expect(builder.resolveLogFilePath).toHaveBeenCalledWith(filePath);
    });

    it("returns null if passed a file path that does not exist", function() {
      filePath = "/foo/bar/quux.tex";
      const result = builder.parseLogFile(filePath);

      expect(result).toBeNull();
      expect(logParser.parse).not.toHaveBeenCalled();
    });

    it("attempts to parse the resolved log file", function() {
      builder.parseLogFile(filePath);

      expect(builder.getLogParser).toHaveBeenCalledWith(logFilePath);
      expect(logParser.parse).toHaveBeenCalled();
    });
  });

  describe("run", function() {
    let exitCode;

    it("successfully executes latexmk when given a valid TeX file", function() {
      waitsForPromise(function() {
        return builder.run(filePath).then(code => exitCode = code);
      });

      runs(function() {
        expect(exitCode).toBe(0);
      });
    });

    it("successfully executes latexmk when given a file path containing spaces", function() {
      filePath = path.join(fixturesPath, "filename with spaces.tex");

      waitsForPromise(function() {
        return builder.run(filePath).then(code => exitCode = code);
      });

      runs(function() {
        expect(exitCode).toBe(0);
      });
    });

    it("fails to execute latexmk when given invalid arguments", function() {
      spyOn(builder, "constructArgs").andReturn(["-invalid-argument"]);

      waitsForPromise(function() {
        return builder.run(filePath).then(code => exitCode = code);
      });

      runs(function() {
        expect(exitCode).toBe(10);
      });
    });

    it("fails to execute latexmk when given invalid file path", function() {
      filePath = path.join(fixturesPath, "foo.tex");
      const args = builder.constructArgs(filePath);

      // Need to remove the "force" flag to trigger the desired failure.
      const removed = args.splice(1, 1);
      expect(removed).toEqual(["-f"]);

      spyOn(builder, "constructArgs").andReturn(args);

      waitsForPromise(function() {
        return builder.run(filePath).then(code => exitCode = code);
      });

      runs(function() {
        expect(exitCode).toBe(11);
      });
    });
  });
});
