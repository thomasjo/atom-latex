"use babel";

import child_process from "child_process";
import Opener from "../opener";

export default class SumatraOpener extends Opener {
  open(filePath, texPath, lineNumber, callback) {
    const sumatraPath = atom.config.get("latex.sumatraPath");
    const args = [
      "-forward-search",
      texPath,
      lineNumber,
      filePath,
    ];

    child_process.execFile(sumatraPath, args, (error) => {
      if (callback) {
        callback((error) ? error.code : 0);
      }
    });
  }
}
