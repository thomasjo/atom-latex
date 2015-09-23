"use babel";

import Opener from "../opener";
import child_process from "child_process";

export default class CustomOpener extends Opener {
  // Used the custom pdf viewer method
  open(filePath, texPath, lineNumber, callback) {
    const command = `okular --unique "${filePath}#src:${lineNumber} ${texPath}"`;

    child_process.exec(command, (error) => {
      if (callback) {
        callback((error) ? error.code : 0);
      }
    });
  }
}
