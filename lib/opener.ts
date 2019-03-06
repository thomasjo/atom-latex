import { Disposable } from "atom";

export default abstract class Opener extends Disposable {
  public shouldOpenInBackground() {
    return atom.config.get("latex.openResultInBackground");
  }

  public hasSynctex() {
    return false;
  }

  public canOpenInBackground() {
    return false;
  }

  public abstract canOpen(filePath: string): boolean;
  public abstract async open(filePath: string, texPath: string, lineNumber: number): Promise<void>;
}
