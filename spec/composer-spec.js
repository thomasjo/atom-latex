"use babel";

import helpers from "./spec-helpers";
import _ from "lodash";
import {Directory} from "atom";
import fs from "fs-plus";
import path from "path";
import Composer from "../lib/composer";

describe("Composer", function() {
  let composer;

  beforeEach(function() {
    composer = new Composer();
  });

  describe("build", function() {
    let editor, builder;

    function initializeSpies(filePath, statusCode = 0) {
      editor = jasmine.createSpyObj("MockEditor", ["save", "isModified"]);
      spyOn(composer, "resolveRootFilePath").andReturn(filePath);
      spyOn(composer, "getEditorDetails").andReturn({
        editor: editor,
        filePath: filePath,
      });

      builder = jasmine.createSpyObj("MockBuilder", ["run", "constructArgs", "parseLogFile"]);
      builder.run.andCallFake(function() {
        switch (statusCode) {
          case 0: { return Promise.resolve(statusCode); }
        }

        return Promise.reject(statusCode);
      });
      spyOn(latex, "getBuilder").andReturn(builder);
    }

    beforeEach(function() {
      spyOn(composer, "showResult").andReturn();
      spyOn(composer, "showError").andReturn();
    });

    it("does nothing for new, unsaved files", function() {
      initializeSpies(null);

      let result = "aaaaaaaaaaaa";
      waitsForPromise(function() {
        return composer.build().catch(r => result = r);
      });

      runs(function() {
        expect(result).toBe(false);
        expect(composer.showResult).not.toHaveBeenCalled();
        expect(composer.showError).not.toHaveBeenCalled();
      });
    });

    it("does nothing for unsupported file extensions", function() {
      initializeSpies("foo.bar");

      let result;
      waitsForPromise(function() {
        return composer.build().catch(r => result = r);
      });

      runs(function() {
        expect(result).toBe(false);
        expect(composer.showResult).not.toHaveBeenCalled();
        expect(composer.showError).not.toHaveBeenCalled();
      });
    });

    it("saves the file before building, if modified", function() {
      initializeSpies("file.tex");
      editor.isModified.andReturn(true);

      builder.parseLogFile.andReturn({
        outputFilePath: "file.pdf",
        errors: [],
        warnings: [],
      });

      waitsForPromise(function() {
        return composer.build();
      });

      runs(function() {
        expect(editor.isModified).toHaveBeenCalled();
        expect(editor.save).toHaveBeenCalled();
      });
    });

    it("invokes `showResult` after a successful build, with expected log parsing result", function() {
      const result = {
        outputFilePath: "file.pdf",
        errors: [],
        warnings: [],
      };

      initializeSpies("file.tex");
      builder.parseLogFile.andReturn(result);

      waitsForPromise(function() {
        return composer.build();
      });

      runs(function() {
        expect(composer.showResult).toHaveBeenCalledWith(result);
      });
    });

    it("treats missing output file data in log file as an error", function() {
      initializeSpies("file.tex");

      builder.parseLogFile.andReturn({
        outputFilePath: null,
        errors: [],
        warnings: [],
      });

      waitsForPromise({shouldReject: true}, function() {
        return composer.build();
      });

      runs(function() {
        expect(composer.showError).toHaveBeenCalled();
      });
    });

    it("treats missing result from parser as an error", function() {
      initializeSpies("file.tex");
      builder.parseLogFile.andReturn(null);

      waitsForPromise({shouldReject: true}, function() {
        return composer.build();
      });

      runs(function() {
        expect(composer.showError).toHaveBeenCalled();
      });
    });

    it("handles active item not being a text editor", function() {
      spyOn(atom.workspace, "getActiveTextEditor").andReturn();
      spyOn(composer, "getEditorDetails").andCallThrough();

      waitsForPromise({shouldReject: true}, function() {
        return composer.build();
      });

      runs(function() {
        expect(composer.getEditorDetails).toHaveBeenCalled();
      });
    });
  });

  describe("clean", function() {
    const extensions = [".bar", ".baz", ".quux"];

    function fakeFilePaths(filePath) {
      const filePathSansExtension = filePath.substring(0, filePath.lastIndexOf("."));
      return extensions.map(ext => filePathSansExtension + ext);
    }

    function initializeSpies(filePath) {
      spyOn(composer, "getEditorDetails").andReturn({filePath});
      spyOn(composer, "resolveRootFilePath").andReturn(filePath);
    }

    beforeEach(function() {
      spyOn(fs, "remove").andCallThrough();
      helpers.spyOnConfig("latex.cleanExtensions", extensions);
    });

    it("deletes all files for the current tex document when output has not been redirected", function() {
      const filePath = "/a/foo.tex";
      const filesToDelete = fakeFilePaths(filePath);
      initializeSpies(filePath);

      let candidatePaths;
      waitsForPromise(function() {
        return composer.clean().then(resolutions => {
          candidatePaths = _.pluck(resolutions, "filePath");
        });
      });

      runs(function() {
        expect(candidatePaths).toEqual(filesToDelete);
      });
    });

    it("stops immidiately if the file is not a TeX document", function() {
      const filePath = "foo.bar";
      initializeSpies(filePath, []);

      waitsForPromise({shouldReject: true}, function() {
        return composer.clean();
      });

      runs(function() {
        expect(composer.resolveRootFilePath).not.toHaveBeenCalled();
        expect(fs.remove).not.toHaveBeenCalled();
      });
    });
  });

  describe("shouldMoveResult", function() {
    it("should return false when using neither an output directory, nor the move option", function() {
      helpers.spyOnConfig("latex.outputDirectory", "");
      helpers.spyOnConfig("latex.moveResultToSourceDirectory", false);

      expect(composer.shouldMoveResult()).toBe(false);
    });

    it("should return false when not using an output directory, but using the move option", function() {
      helpers.spyOnConfig("latex.outputDirectory", "");
      helpers.spyOnConfig("latex.moveResultToSourceDirectory", true);

      expect(composer.shouldMoveResult()).toBe(false);
    });

    it("should return false when not using the move option, but using an output directory", function() {
      helpers.spyOnConfig("latex.outputDirectory", "baz");
      helpers.spyOnConfig("latex.moveResultToSourceDirectory", false);

      expect(composer.shouldMoveResult()).toBe(false);
    });

    it("should return true when using both an output directory and the move option", function() {
      helpers.spyOnConfig("latex.outputDirectory", "baz");
      helpers.spyOnConfig("latex.moveResultToSourceDirectory", true);

      expect(composer.shouldMoveResult()).toBe(true);
    });
  });

  describe("resolveProjectPath", function() {
    it("returns the parent directory path for a roaming file", function() {
      const filePath = "/bar/quux.tex";
      const expectedPath = path.dirname(filePath);

      spyOn(composer, "getProjectDirectories").andReturn([
        new Directory("/foo"),
      ]);

      const resolvedPath = composer.resolveProjectPath(filePath);

      expect(resolvedPath).toBe(expectedPath);
    });

    it("returns the project path for a file belonging to a simple project", function() {
      const filePath = "/foo/quux.tex";
      const expectedPath = path.dirname(filePath);

      spyOn(composer, "getProjectDirectories").andReturn([
        new Directory("/foo"),
      ]);

      const resolvedPath = composer.resolveProjectPath(filePath);

      expect(resolvedPath).toBe(expectedPath);
    });

    it("returns the project path for a file belonging to a project with multiple directories", function() {
      const filePath = "/foo/quux.tex";
      const expectedPath = path.dirname(filePath);

      spyOn(composer, "getProjectDirectories").andReturn([
        new Directory("/foo"),
        new Directory("/bar"),
      ]);

      const resolvedPath = composer.resolveProjectPath(filePath);

      expect(resolvedPath).toBe(expectedPath);
    });

    it("returns the longest project path for a file belonging to a multiple directories", function() {
      const filePath = "/foo/bar/quux.tex";
      const expectedPath = path.dirname(filePath);

      spyOn(composer, "getProjectDirectories").andReturn([
        new Directory("/foo"),
        new Directory("/foo/bar"),
      ]);

      const resolvedPath = composer.resolveProjectPath(filePath);

      expect(resolvedPath).toBe(expectedPath);
    });
  });
});
