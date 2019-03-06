import fs from "fs";

export default abstract class Parser {
  public filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public abstract parse(): any;

  public getLines(defaultLines: string[] | null = null) {
    if (!fs.existsSync(this.filePath)) {
      if (defaultLines) { return defaultLines; }
      throw new Error(`No such file: ${this.filePath}`);
    }

    const rawFile = fs.readFileSync(this.filePath, { encoding: "utf-8" });
    const lines = rawFile.replace(/(\r\n)|\r/g, "\n").split("\n");
    return lines;
  }
}
