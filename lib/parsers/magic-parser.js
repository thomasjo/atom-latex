"use babel";

import fs from "fs-plus";

const magicCommentPattern = new RegExp(""
  + "^%\\s*"    // Optional whitespace.
  + "!TEX"      // Magic marker.
  + "\\s+"      // Semi-optional whitespace.
  + "(\\w+)"    // [1] Captures the magic keyword. E.g. "root".
  + "\\s*=\\s*" // Equal sign wrapped in optional whitespace.
  + "(.*)"      // [2] Captures everything following the equal sign.
  + "$"         // EOL.
);

export default class MagicParser {
  constructor(filePath) {
    this.filePath = filePath;
  }

  parse() {
    const result = {};
    const lines = this.getLines();
    for (const line of lines) {
      const match = line.match(magicCommentPattern);
      if (!match) { break; } // Stop parsing unless line is a magic comment.
      result[match[1]] = match[2];
    }

    return result;
  }

  getLines() {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`No such file: ${this.filePath}`);
    }

    const rawFile = fs.readFileSync(this.filePath, {encoding: "utf-8"});
    const lines = rawFile.replace(/(\r\n)|\r/g, "\n").split("\n");
    return lines;
  }
}
