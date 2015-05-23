"use babel";

import "../spec-helpers";

import path from "path";
import LogParser from "../../lib/parsers/log-parser";

describe("LogParser", function() {
  let fixturesPath;

  beforeEach(function() {
    fixturesPath = atom.project.getPaths()[0];
  });

  describe("parse", function() {
    it("returns the expected output path", function() {
      const logFile = path.join(fixturesPath, "file.log");
      const parser = new LogParser(logFile);
      const result = parser.parse();
      const outputFilePath = path.posix.resolve(result.outputFilePath);

      expect(outputFilePath).toBe("/foo/output/file.pdf");
    });

    it("parses and returns all errors", function() {
      const logFile = path.join(fixturesPath, "errors.log");
      const parser = new LogParser(logFile);
      const result = parser.parse();

      expect(result.errors.length).toBe(3);
    });

    it("associates an error with a file path, line number, and message", function() {
      const logFile = path.join(fixturesPath, "errors.log");
      const parser = new LogParser(logFile);
      const result = parser.parse();
      const error = result.errors[0];

      expect(error).toEqual({
        logPosition: [196, 0],
        filePath: "./errors.tex",
        lineNumber: 10,
        message: "\\begin{gather*} on input line 8 ended by \\end{gather}",
      });
    });
  });

  describe("getLines", function() {
    it("returns the expected number of lines", function() {
      const logFile = path.join(fixturesPath, "file.log");
      const parser = new LogParser(logFile);
      const lines = parser.getLines();

      expect(lines.length).toBe(63);
    });

    it("throws an error when passed a filepath that doesn't exist", function() {
      const logFile = path.join(fixturesPath, "nope.log");
      const parser = new LogParser(logFile);

      expect(parser.getLines).toThrow();
    });
  });
});
