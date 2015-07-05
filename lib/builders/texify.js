"use babel";

import child_process from "child_process";
import fs from "fs-plus";
import path from "path";
import Builder from "../builder";
import LogParser from "../parsers/log-parser";

export default class TexifyBuilder extends Builder {
  constructor() {
    super();
    this.executable = "texify";
  }

  run(filePath) {
    const args = this.constructArgs(filePath);
    const command = `texify ${args.join(" ")}`;
    const options = this.constructChildProcessOptions();

    options.cwd = path.dirname(filePath); // Run process with sensible CWD.
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
        // "-c", // can't clean if we want to parse log file
        "-b",
        "--pdf",
    ];

    const enableShellEscape = atom.config.get("latex.enableShellEscape");
    const customEngine = atom.config.get("latex.customEngine");
    const engine = atom.config.get("latex.engine");

    if (enableShellEscape) {
      args.push("--tex-option=--shell-escape");
    }

    if (customEngine) {
      args.push(`--engine=\"${customEngine}\"`);
    }
    else if (engine && engine !== "pdflatex") {
      args.push(`--engine=${engine}`);
    }

    let outdir = atom.config.get("latex.outputDirectory");
    if (outdir) {
      const dir = path.dirname(filePath);
      outdir = path.join(dir, outdir);
      args.push(`--tex-option=\"-output-directory=${outdir}\"`);
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
