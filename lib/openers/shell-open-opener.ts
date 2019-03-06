import Opener from "../opener";

export default class ShellOpenOpener extends Opener {
  public canOpen(_filePath: string) {
    return process.platform === "win32";
  }

  public async open(filePath: string, _texPath: string, _lineNumber: number) {
    const command = `"${filePath}"`;
    await latex.process.executeChildProcess(command, { showError: true });
  }
}
