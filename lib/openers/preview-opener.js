"use babel";

const child_process = require("child_process");
const Opener = require("../opener");

module.exports =
class PreviewOpener extends Opener {
  open(filePath, texPath, lineNumber, callback) {
    // TODO: Nuke this?
    if (typeof texPath === "function") {
      callback = texPath;
    }

    let command = `open -g -a Preview.app ${filePath}`;
    if (!this.shouldOpenInBackground()) {
      command = command.replace(/\-g\s/, "");
    }

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0);
      }
    });
  }
};
