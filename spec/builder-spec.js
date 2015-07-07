"use babel";

import helpers from "./spec-helpers";
import path from "path";
import Builder from "../lib/builder";

describe("Builder", function() {
  let builder, fixturesPath, filePath, logFilePath;

  beforeEach(function() {
    builder = new Builder();
    fixturesPath = helpers.cloneFixtures();
    filePath = path.join(fixturesPath, "file.tex");
    logFilePath = path.join(fixturesPath, "file.log");
  });

  describe("constructPath", function() {
    it("reads `latex.texPath` as configured", function() {
      spyOn(atom.config, "get").andReturn();
      builder.constructPath();

      expect(atom.config.get).toHaveBeenCalledWith("latex.texPath");
    });

    it("uses platform default when `latex.texPath` is not configured", function() {
      const defaultTexPath = "/foo/bar";
      const expectedPath = [defaultTexPath, process.env.PATH].join(path.delimiter);
      helpers.spyOnConfig("latex.texPath", "");
      spyOn(builder, "defaultTexPath").andReturn(defaultTexPath);

      const constructedPath = builder.constructPath();

      expect(constructedPath).toBe(expectedPath);
    });

    it("replaces surrounded $PATH with process.env.PATH", function() {
      const texPath = "/foo:$PATH:/bar";
      const expectedPath = texPath.replace("$PATH", process.env.PATH);
      helpers.spyOnConfig("latex.texPath", texPath);

      const constructedPath = builder.constructPath();

      expect(constructedPath).toBe(expectedPath);
    });

    it("replaces leading $PATH with process.env.PATH", function() {
      const texPath = "$PATH:/bar";
      const expectedPath = texPath.replace("$PATH", process.env.PATH);
      helpers.spyOnConfig("latex.texPath", texPath);

      const constructedPath = builder.constructPath();

      expect(constructedPath).toBe(expectedPath);
    });

    it("replaces trailing $PATH with process.env.PATH", function() {
      const texPath = "/foo:$PATH";
      const expectedPath = texPath.replace("$PATH", process.env.PATH);
      helpers.spyOnConfig("latex.texPath", texPath);

      const constructedPath = builder.constructPath();

      expect(constructedPath).toBe(expectedPath);
    });

    it("prepends process.env.PATH with texPath", function() {
      const texPath = "/foo";
      const expectedPath = [texPath, process.env.PATH].join(path.delimiter);
      helpers.spyOnConfig("latex.texPath", texPath);

      const constructedPath = builder.constructPath();

      expect(constructedPath).toBe(expectedPath);
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
});
