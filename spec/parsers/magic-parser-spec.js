"use babel";

import path from "path";
import MagicParser from "../../lib/parsers/magic-parser";

describe("MagicParser", function() {
  let fixturesPath;

  beforeEach(function() {
    fixturesPath = atom.project.getPaths()[0];
  });

  describe("parse", function() {
    it("returns an empty object when file contains no magic comments", function() {
      const filePath = path.join(fixturesPath, "file.tex");
      const parser = new MagicParser(filePath);
      const result = parser.parse();

      expect(result).toEqual({});
    });

    it("returns path to root file when file contains magic root comment", function() {
      const filePath = path.join(fixturesPath, "magic-comments", "root-comment.tex");
      const parser = new MagicParser(filePath);
      const result = parser.parse();

      expect(result).toEqual({
        "root": "../file.tex",
      });
    });

    it("returns an empty object when magic comment is not on the first line", function() {
      const filePath = path.join(fixturesPath, "magic-comments", "not-first-line.tex");
      const parser = new MagicParser(filePath);
      const result = parser.parse();

      expect(result).toEqual({});
    });

    it("handles magic comments without optional whitespace", function() {
      const filePath = path.join(fixturesPath, "magic-comments", "no-whitespace.tex");
      const parser = new MagicParser(filePath);
      const result = parser.parse();

      expect(result).not.toEqual({});
    });
  });
});
