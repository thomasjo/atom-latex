"use babel";

import child_process from "child_process";
import fs from "fs-plus";
import path from "path";
import Builder from "../builder";
import LogParser from "../parsers/log-parser";

export default class LatexmkBuilder extends Builder {
  run(filePath) {
    const args = this.constructArgs(filePath);
    const command = `latexmk ${args.join(" ")}`;
    const options = this.constructChildProcessOptions();

    options.maxBuffer = 52428800; // Set process' max buffer size to 50 MB.
    options.env.max_print_line = 1000; // Max log file line length.

    return new Promise((resolve) => {
      // TODO: Add support for killing the process.
      child_process.exec(command, options, (error) => {
        resolve((error) ? error.code : 0);
      });
    });
  }

  constructArgs(filePath) {
    const args = [
      "-interaction=nonstopmode",
      "-f",
      "-cd",
      "-pdf",
      "-synctex=1",
      "-file-line-error",
    ];

    const enableShellEscape = atom.config.get("latex.enableShellEscape");
    const customEngine = atom.config.get("latex.customEngine");
    const engine = atom.config.get("latex.engine");

    if (enableShellEscape) {
      args.push("-shell-escape");
    }

    if (customEngine) {
      args.push(`-pdflatex=\"${customEngine}\"`);
    }
    else if (engine && engine !== "pdflatex") {
      args.push(`-${engine}`);
    }

    let outdir = atom.config.get("latex.outputDirectory");
    if (outdir) {
      const dir = path.dirname(filePath);
      outdir = path.join(dir, outdir);
      args.push(`-outdir=\"${outdir}\"`);
    }

    args.push(`\"${filePath}\"`);
    return args;
  }

  parseLogFile(texFilePath) {
    const logFilePath = this.resolveLogFilePath(texFilePath);
    if (!fs.existsSync(logFilePath)) { return null; }

    const parser = this.getLogParser(logFilePath);
    return parser.parse();
  }

  getLogParser(logFilePath) {
    return new LogParser(logFilePath);
  }
}
