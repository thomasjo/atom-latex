"use babel";

import helpers from "./spec-helpers";
import path from "path";
import Builder from "../lib/builder";

describe("Builder", function() {
  let builder;

  beforeEach(function() {
    builder = new Builder();
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
});
