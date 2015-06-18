"use babel";

import _ from "lodash";
import path from "path";

export default class Builder {
  constructor() {
    this.envPathKey = this.getEnvironmentPathKey(process.platform);
  }

  run(/* filePath */) {}
  constructArgs(/* filePath */) {}
  parseLogFile(/* texFilePath */) {}

  constructChildProcessOptions() {
    const env = _.clone(process.env);
    const childPath = this.constructPath();
    if (childPath) {
      env[this.envPathKey] = childPath;
    }

    return {env};
  }

  constructPath() {
    let texPath = (atom.config.get("latex.texPath") || "").trim();
    if (texPath.length === 0) {
      texPath = this.defaultTexPath(process.platform);
    }

    const processPath = process.env[this.envPathKey];
    const match = texPath.match(/^(.*)(\$PATH)(.*)$/);
    if (match) {
      return `${match[1]}${processPath}${match[3]}`;
    }

    return [texPath, processPath]
      .filter(str => str && str.length > 0)
      .join(path.delimiter);
  }

  defaultTexPath(platform) {
    if (platform === "win32") {
      return [
        "C:\\texlive\\2014\\bin\\win32",
        "C:\\Program Files\\MiKTeX 2.9\\miktex\\bin\\x64",
        "C:\\Program Files (x86)\\MiKTeX 2.9\\miktex\\bin",
      ].join(";");
    }

    return "/usr/texbin";
  }

  resolveLogFilePath(texFilePath) {
    const outputDirectory = atom.config.get("latex.outputDirectory") || "";
    const currentDirectory = path.dirname(texFilePath);
    const fileName = path.basename(texFilePath).replace(/\.\w+$/, ".log");

    return path.join(currentDirectory, outputDirectory, fileName);
  }

  getEnvironmentPathKey(platform) {
    if (platform === "win32") { return "Path"; }
    return "PATH";
  }
}
