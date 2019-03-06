import Opener from "../opener";

export default class XdgOpenOpener extends Opener {
  public canOpen(_filePath: string) {
    return process.platform === "linux";
  }

  public async open(filePath: string, _texPath: string, _lineNumber: number) {
    const command = `xdg-open "${filePath}"`;
    await latex.process.executeChildProcess(command, { showError: true });
  }
}
