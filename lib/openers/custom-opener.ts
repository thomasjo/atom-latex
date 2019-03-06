import fs from "fs";

import Opener from "../opener";
import { isPdfFile } from "../werkzeug";

export default class CustomOpener extends Opener {
  public canOpen(filePath: string) {
    const binaryExists = fs.existsSync(atom.config.get("latex.viewerPath"));
    return isPdfFile(filePath) && binaryExists;
  }

  public async open(filePath: string, _texPath: string, _lineNumber: number) {
    const command = `"${atom.config.get("latex.viewerPath")}" "${filePath}"`;
    await latex.process.executeChildProcess(command, { showError: true });
  }
}
