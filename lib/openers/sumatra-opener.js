"use babel";

const child_process = require("child_process");
const Opener = require("../opener");

module.exports =
class SumatraOpener extends Opener {
  open(filePath, texPath, lineNumber, callback) {
    const sumatraPath = atom.config.get("latex.sumatraPath");
    const args = [
      "-forward-search",
      texPath,
      lineNumber,
      filePath,
    ];
    const command = `${sumatraPath} ${args.join(" ")}`;

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0);
      }
    });
  }
};
