"use babel";

module.exports =
class Opener {
  open(/* filePath, texPath, lineNumber, callback */) {}

  shouldOpenInBackground() {
    return atom.config.get("latex.openResultInBackground");
  }
};
