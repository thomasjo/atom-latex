"use babel";

import fs from "fs-plus";
import path from "path";
import {heredoc} from "./werkzeug";

export default class Composer {
  destroy() {
    this.destroyProgressIndicator();
    this.destroyErrorIndicator();
  }

  async build() {
    const {editor, filePath} = this.getEditorDetails();

    if (!filePath) {
      latex.log.warning("File needs to be saved to disk before it can be TeXified.");
      return Promise.reject(false);
    }

    if (!this.isTexFile(filePath)) {
      latex.log.warning(heredoc(`File does not seem to be a TeX file;
        unsupported extension "${path.extname(filePath)}".`));
      return Promise.reject(false);
    }

    if (editor.isModified()) {
      editor.save(); // TODO: Make this configurable?
    }

    const builder = latex.getBuilder();
    const rootFilePath = this.resolveRootFilePath(filePath);
    const projectPath = this.resolveProjectPath(rootFilePath);

    this.destroyErrorIndicator();
    this.showProgressIndicator();

    const self = this;
    return new Promise(async function(resolve, reject) {
      let statusCode, result;

      const showBuildError = function() {
        self.showError(statusCode, result, builder);
        reject(statusCode);
      };

      try {
        statusCode = await builder.run(rootFilePath, projectPath);
        result = builder.parseLogFile(rootFilePath);
        if (statusCode > 0 || !result || !result.outputFilePath) {
          showBuildError(statusCode, result, builder);
          return;
        }

        if (self.shouldMoveResult()) {
          self.moveResult(result, rootFilePath);
        }

        self.showResult(result);
        resolve(statusCode);
      }
      catch (error) {
        console.error(error.message);
        reject(error.message);
      }
      finally {
        self.destroyProgressIndicator();
      }
    });
  }

  sync() {
    const {filePath, lineNumber} = this.getEditorDetails();
    if (!filePath || !this.isTexFile(filePath)) {
      return;
    }

    const outputFilePath = this.resolveOutputFilePath(filePath);
    if (!outputFilePath) {
      latex.log.warning("Could not resolve path to output file associated with the current file.");
      return;
    }

    const opener = latex.getOpener();
    if (opener) {
      opener.open(outputFilePath, filePath, lineNumber);
    }
  }

  // NOTE: Does not support `latex.outputDirectory` setting!
  async clean() {
    const {filePath} = this.getEditorDetails();
    if (!filePath || !this.isTexFile(filePath)) {
      return Promise.reject();
    }

    const rootFilePath = this.resolveRootFilePath(filePath);
    const rootPath = path.dirname(rootFilePath);
    let rootFile = path.basename(rootFilePath);
    rootFile = rootFile.substring(0, rootFile.lastIndexOf("."));

    const cleanExtensions = atom.config.get("latex.cleanExtensions");
    return await* cleanExtensions.map(async function(extension) {
      const candidatePath = path.join(rootPath, rootFile + extension);
      return new Promise(async function(resolve) {
        fs.remove(candidatePath, (error) => {
          resolve({filePath: candidatePath, error: error});
        });
      });
    });
  }

  setStatusBar(statusBar) {
    this.statusBar = statusBar;
  }

  moveResult(result, filePath) {
    const originalOutputFilePath = result.outputFilePath;
    result.outputFilePath = this.alterParentPath(filePath, originalOutputFilePath);
    if (fs.existsSync(originalOutputFilePath)) {
      fs.removeSync(result.outputFilePath);
      fs.moveSync(originalOutputFilePath, result.outputFilePath);
    }

    const originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, ".synctex.gz");
    if (fs.existsSync(originalSyncFilePath)) {
      const syncFilePath = this.alterParentPath(filePath, originalSyncFilePath);
      fs.removeSync(syncFilePath);
      fs.moveSync(originalSyncFilePath, syncFilePath);
    }
  }

  resolveRootFilePath(filePath) {
    const MasterTexFinder = require("./master-tex-finder");
    const finder = new MasterTexFinder(filePath);
    return finder.getMasterTexPath();
  }

  resolveProjectPath(filePath) {
    const projectDirectories = this.getProjectDirectories();
    const candidatePaths = projectDirectories
      .filter(x => x.contains(filePath))
      .map(x => x.path);
    switch (candidatePaths.length) {
      case 0: return path.dirname(filePath);
      case 1: return candidatePaths[0];
    }

    const sortedCandidatePaths = candidatePaths.sort((one, other) => {
      return other.length - one.length;
    });

    return sortedCandidatePaths[0];
  }

  resolveOutputFilePath(filePath) {
    let outputFilePath, rootFilePath;

    if (this.outputLookup) {
      outputFilePath = this.outputLookup[filePath];
    }

    if (!outputFilePath) {
      rootFilePath = this.resolveRootFilePath(filePath);

      const builder = latex.getBuilder();
      const result = builder.parseLogFile(rootFilePath);
      if (!result || !result.outputFilePath) {
        latex.log.warning("Log file parsing failed!");
        return null;
      }

      this.outputLookup = this.outputLookup || {};
      this.outputLookup[filePath] = result.outputFilePath;
    }

    if (this.shouldMoveResult()) {
      outputFilePath = this.alterParentPath(rootFilePath, outputFilePath);
    }

    return outputFilePath;
  }

  showResult(result) {
    if (!this.shouldOpenResult()) { return; }

    const opener = latex.getOpener();
    if (opener) {
      const {filePath, lineNumber} = this.getEditorDetails();
      opener.open(result.outputFilePath, filePath, lineNumber);
    }
  }

  showError(statusCode, result, builder) {
    this.showErrorIndicator(result);
    latex.log.error(statusCode, result, builder);
  }

  showProgressIndicator() {
    if (!this.statusBar) { return null; }
    if (this.indicator) { return this.indicator; }

    const ProgressIndicatorView = require("./views/progress-indicator-view");
    this.indicator = new ProgressIndicatorView();
    this.statusBar.addRightTile({item: this.indicator, priority: 9001});

    return this.indicator;
  }

  showErrorIndicator(result) {
    if (!this.statusBar) { return null; }
    if (this.errorIndicator) { return this.errorIndicator; }

    const ErrorIndicatorView = require("./views/error-indicator-view");
    this.errorIndicator = new ErrorIndicatorView();
    this.errorIndicator.initialize(result);
    this.statusBar.addRightTile({item: this.errorIndicator, priority: 9001});

    return this.errorIndicator;
  }

  destroyProgressIndicator() {
    if (this.indicator) {
      this.indicator.remove();
      this.indicator = null;
    }
  }

  destroyErrorIndicator() {
    if (this.errorIndicator) {
      this.errorIndicator.remove();
      this.errorIndicator = null;
    }
  }

  isTexFile(filePath) {
    // TODO: Improve; will suffice for the time being.
    return !filePath || filePath.search(/\.(tex|lhs)$/) > 0;
  }

  getEditorDetails() {
    const editor = atom.workspace.getActiveTextEditor();
    let filePath, lineNumber;
    if (editor) {
      filePath = editor.getPath();
      lineNumber = editor.getCursorBufferPosition().row + 1;
    }

    return {
      editor: editor,
      filePath: filePath,
      lineNumber: lineNumber,
    };
  }

  getProjectDirectories() {
    return atom.project.getDirectories();
  }

  alterParentPath(targetPath, originalPath) {
    const targetDir = path.dirname(targetPath);
    return path.join(targetDir, path.basename(originalPath));
  }

  shouldMoveResult() {
    const moveResult = atom.config.get("latex.moveResultToSourceDirectory");
    const outputDirectory = atom.config.get("latex.outputDirectory");
    return moveResult && outputDirectory.length > 0;
  }

  shouldOpenResult() { return atom.config.get("latex.openResultAfterBuild"); }
}
