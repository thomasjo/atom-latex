import { CompositeDisposable, Disposable } from "atom";
import _ from "lodash";
import path from "path";

import Opener from "./opener";

export default class OpenerRegistry extends Disposable {
  public openers = new Map<string, Opener>();
  public disposables = new CompositeDisposable();

  constructor() {
    super(() => this.disposables.dispose());
    this.initializeOpeners();
  }

  public initializeOpeners() {
    const schema: any = atom.config.getSchema("latex.opener");
    for (const openerName of schema.enum) {
      if (openerName !== "automatic") {
        const opener = this.createOpener(openerName);
        this.disposables.add(opener);
        this.openers.set(openerName, opener);
      }
    }
  }

  public createOpener(name: string) {
    const OpenerImpl: new() => Opener = require(this.openerPath(name)).default;
    return new OpenerImpl();
  }

  public openerPath(name: string) {
    return path.format({
      dir: path.join(__dirname, "openers"),
      ext: ".ts",
      name: `${name}-opener`,
    });
  }

  public checkRuntimeDependencies() {
    const pdfOpeners = Array.from(this.getCandidateOpeners("foo.pdf").keys());
    if (pdfOpeners.length) {
      latex.log.info(`The following PDF capable openers were found: ${pdfOpeners.join(", ")}.`);
    } else {
      latex.log.error("No PDF capable openers were found.");
    }

    const psOpeners = Array.from(this.getCandidateOpeners("foo.ps").keys());
    if (psOpeners.length) {
      latex.log.info(`The following PS capable openers were found: ${psOpeners.join(", ")}.`);
    } else {
      latex.log.warning("No PS capable openers were found.");
    }

    const dviOpeners = Array.from(this.getCandidateOpeners("foo.dvi").keys());
    if (dviOpeners.length) {
      latex.log.info(`The following DVI capable openers were found: ${dviOpeners.join(", ")}.`);
    } else {
      latex.log.warning("No DVI capable openers were found.");
    }
  }

  public async open(filePath: string, texPath: string, lineNumber: number) {
    const name = atom.config.get("latex.opener");
    let opener = this.openers.get(name);

    if (!opener || !opener.canOpen(filePath)) {
      opener = this.findOpener(filePath);
    }

    if (opener) {
      return opener.open(filePath, texPath, lineNumber);
    } else {
      latex.log.warning(`No opener found that can open ${filePath}.`);
    }
  }

  public getCandidateOpeners(filePath: string) {
    const candidates = new Array<Opener>();
    for (const candidate of this.openers.values()) {
      if (candidate.canOpen(filePath)) {
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  public findOpener(filePath: string) {
    const openResultInBackground = atom.config.get("latex.openResultInBackground");
    const enableSynctex = atom.config.get("latex.enableSynctex");
    const candidates = this.getCandidateOpeners(filePath);
    if (!candidates.length) { return; }

    const rankedCandidates = _.orderBy(candidates,
      [(opener) => opener.hasSynctex(), (opener) => opener.canOpenInBackground()],
      ["desc", "desc"],
    );

    if (enableSynctex) {
      // If the user wants openResultInBackground also and there is an opener
      // that supports that and SyncTeX it will be the first one because of
      // the priority sort.
      const opener = rankedCandidates.find((candidate) => candidate.hasSynctex());
      if (opener) { return opener; }
    }

    if (openResultInBackground) {
      const opener = rankedCandidates.find((candidate) => candidate.canOpenInBackground());
      if (opener) { return opener; }
    }

    return rankedCandidates[0];
  }
}
