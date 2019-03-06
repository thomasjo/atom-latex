import fs from "fs";

import Opener from "../opener";
import { isPdfFile, isPsFile } from "../werkzeug";

export default class QpdfviewOpener extends Opener {
  public hasSynctex() {
    return true;
  }

  public canOpen(filePath: string) {
    const supportedFile = isPdfFile(filePath) || isPsFile(filePath);
    const binaryExists = fs.existsSync(atom.config.get("latex.qpdfviewPath"));
    return process.platform === "linux" && supportedFile && binaryExists;
  }

  public async open(filePath: string, texPath: string, lineNumber: number) {
    const args = [
      `--unique`,
      `"${filePath}"#src:"${texPath}":${lineNumber}:0`,
    ];

    const qpdfviewPath = atom.config.get("latex.qpdfviewPath");
    const command = `"${qpdfviewPath}" ${args.join(" ")}`;
    await latex.process.executeChildProcess(command, { showError: true });
  }
}
