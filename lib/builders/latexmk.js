"use babel";

const child_process = require("child_process");
const fs = require("fs-plus");
const path = require("path");
const Builder = require("../builder");
const LogParser = require("../parsers/log-parser");

module.exports =
class LatexmkBuilder extends Builder {
  run(args) {
    const command = `latexmk ${args.join(" ")}`;
    const options = this.constructChildProcessOptions();
    options.env.max_print_line = 1000;  // Max log file line length.

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
};
