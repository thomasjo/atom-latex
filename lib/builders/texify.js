"use babel";

import child_process from "child_process";
import path from "path";
import Builder from "../builder";

export default class TexifyBuilder extends Builder {
  constructor() {
    super();
    this.executable = "texify";
  }

  run(filePath) {
    const args = this.constructArgs(filePath);
    const command = `${this.executable} ${args.join(" ")}`;
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

    let outdir = this.getOutputDirectory(filePath);
    if (outdir) {
      args.push(`--tex-option=\"-output-directory=${outdir}\"`);
    }

    args.push(`\"${filePath}\"`);
    return args;
  }
}
