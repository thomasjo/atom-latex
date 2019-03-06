import fs from "fs";

import Opener from "../opener";
import { isPdfFile, isPsFile } from "../werkzeug";

export default class ZathuraOpener extends Opener {
  public hasSynctex() {
    return true;
  }

  public canOpen(filePath: string) {
    const supportedFile = isPdfFile(filePath) || isPsFile(filePath);
    const binaryExists = fs.existsSync(atom.config.get("latex.zathuraPath"));
    return process.platform === "linux" && supportedFile && binaryExists;
  }

  public async open(filePath: string, texPath: string, lineNumber: number) {
    const atomPath = process.argv[0];
    const args = [
      `--synctex-editor-command="\\"${atomPath}\\" \\"%{input}:%{line}\\""`,
      `--synctex-forward="${lineNumber}:1:${texPath}"`,
      `"${filePath}"`,
    ];

    const zathuraPath = atom.config.get("latex.zathuraPath");
    const command = `"${zathuraPath}" ${args.join(" ")}`;
    await latex.process.executeChildProcess(command, { showError: true });
  }
}
