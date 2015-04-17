"use babel";

const fs = require("fs-plus");
const path = require("path");

module.exports =
class Composer {
  destroy() {
    this.destroyProgressIndicator();
    this.destroyErrorIndicator();
  }

  build() {
    let {editor, filePath} = this.getEditorDetails();

    if (!filePath) {
      latex.log.warning("File needs to be saved to disk before it can be TeXified.");
      return Promise.reject(false);
    }

    if (!this.isTexFile(filePath)) {
      latex.log.warning(`File does not seem to be a TeX file;
        unsupported extension "${path.extname(filePath)}".`);
      return Promise.reject(false);
    }

    if (editor.isModified()) {
      editor.save(); // TODO: Make this configurable?
    }

    let builder = latex.getBuilder();
    let rootFilePath = this.resolveRootFilePath(filePath);
    let args = builder.constructArgs(rootFilePath);

    this.destroyErrorIndicator();
    this.showProgressIndicator();

    return new Promise((resolve, reject) => {
      let showBuildError = (statusCode, result, builder) => {
        this.showError(statusCode, result, builder);
        reject(statusCode);
      };

      let processBuildResult = (statusCode) => {
        let result = builder.parseLogFile(rootFilePath);
        if (!result || !result.outputFilePath) {
          return showBuildError(statusCode, result, builder);
        }

        if (this.shouldMoveResult()) {
          this.moveResult(result, rootFilePath);
        }

        this.showResult(result);
        resolve(statusCode);
      };

      builder.run(args)
        .then(processBuildResult)
        .catch(showBuildError)
        .then(() => this.destroyProgressIndicator())
        ;
    });
  }

  sync() {
    let {filePath, lineNumber} = this.getEditorDetails();
    if (!filePath || !this.isTexFile(filePath)) {
      return;
    }

    let outputFilePath = this.resolveOutputFilePath(filePath);
    if (!outputFilePath) {
      latex.log.warning("Could not resolve path to output file associated with the current file.");
      return;
    }

    let opener = latex.getOpener();
    if (opener) {
      opener.open(outputFilePath, filePath, lineNumber);
    }
  }

  // NOTE: Does not support `latex.outputDirectory` setting!
  clean() {
    let {filePath} = this.getEditorDetails();

    if (!filePath || !this.isTexFile(filePath)) {
      return Promise.reject();
    }

    let rootFilePath = this.resolveRootFilePath(filePath);
    let rootPath = path.dirname(rootFilePath);
    rootFile = path.basename(rootFilePath);
    rootFile = rootFile.substring(0, rootFile.lastIndexOf("."));

    let cleanExtensions = atom.config.get("latex.cleanExtensions");
    Promise.all(cleanExtensions.map((extension) => {
      let candidatePath = path.join(rootPath, rootFile + extension);
      return new Promise((resolve) => {
        fs.remove(candidatePath, (error) => {
          resolve({filePath: candidatePath, error: error});
        });
      });
    }));
  }

  setStatusBar(statusBar) {
    this.statusBar = statusBar;
  }

  moveResult(result, filePath) {
    let originalFilePath = result.outputFilePath;
    result.outputFilePath = this.alterParentPath(filePath, result.outputFilePath);
    if (fs.existsSync(originalFilePath)) {
      fs.moveSync(originalFilePath, result.outputFilePath);
    }

    let syncFilePath = originalFilePath.replace(/\.pdf$/, ".synctex.gz");
    if (fs.existsSync(syncFilePath)) {
      fs.moveSync(syncFilePath, this.alterParentPath(filePath, syncFilePath));
    }
  }

  resolveRootFilePath(filePath) {
    const MasterTexFinder = require("./master-tex-finder");
    finder = new MasterTexFinder(filePath);
    return finder.getMasterTexPath();
  }

  resolveOutputFilePath(filePath) {
    if (this.outputLookup) {
      let outputFilePath = this.outputLookup[filePath];
    }

    if (!outputFilePath) {
      let builder = latex.getBuilder();
      let rootFilePath = this.resolveRootFilePath(filePath);
      let result = builder.parseLogFile(rootFilePath);
      if (!result || !result.outputFilePath) {
        latex.log.warning("Log file parsing failed!");
        return;
      }
      if (!this.outputLookup) {
        this.outputLookup = {};
      }
      this.outputLookup[filePath] = result.outputFilePath;
    }

    if (this.shouldMoveResult()) {
      outputFilePath = this.alterParentPath(rootFilePath, outputFilePath);
    }

    return outputFilePath;
  }

  showResult(result) {
    let opener = latex.getOpener();
    if (this.shouldOpenResult() && opener) {
      let {filePath, lineNumber} = this.getEditorDetails();
      opener.open(result.outputFilePath, filePath, lineNumber);
    }
  }

  showError(statusCode, result, builder) {
    this.showErrorIndicator();
    latex.log.error(statusCode, result, builder);
  }

  showProgressIndicator() {
    if (this.indicator) {
      return this.indicator;
    }

    const ProgressIndicatorView = require("./views/progress-indicator-view");
    this.indicator = new ProgressIndicatorView()
    if (this.statusBar) {
      this.statusBar.addRightTile({item: this.indicator, priority: 9001});
    }

    return this.indicator;
  }

  showErrorIndicator() {
    if (this.errorIndicator) {
      return this.errorIndicator;
    }

    const ErrorIndicatorView = require("./views/error-indicator-view");
    this.errorIndicator = new ErrorIndicatorView();
    if (this.statusBar) {
      this.statusBar.addRightTile({item: this.errorIndicator, priority: 9001});
    }

    return this.errorIndicator;
  }

  destroyProgressIndicator() {
    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }
  }

  destroyErrorIndicator() {
    if (this.errorIndicator) {
      this.errorIndicator.destroy();
      this.errorIndicator = null;
    }
  }

  isTexFile(filePath) {
    // TODO: Improve; will suffice for the time being.
    return !filePath || filePath.search(/\.(tex|lhs)$/) > 0;
  }

  getEditorDetails() {
    editor = atom.workspace.getActiveTextEditor();
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

  alterParentPath(targetPath, originalPath) {
    targetDir = path.dirname(targetPath);
    return path.join(targetDir, path.basename(originalPath));
  }

  shouldMoveResult() { return atom.config.get("latex.moveResultToSourceDirectory"); }
  shouldOpenResult() { return atom.config.get("latex.openResultAfterBuild"); }
}
