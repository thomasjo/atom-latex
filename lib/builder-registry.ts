import fs from "fs";
import path from "path";

import BuildState from "./build-state";

export default class BuilderRegistry {
  public getBuilderImplementation(state: BuildState) {
    const builders = this.getAllBuilders();
    const candidates = builders.filter((builder) => builder.canProcess(state));
    switch (candidates.length) {
      case 0: return null;
      case 1: return candidates[0];
    }

    // This should never happen...
    throw new Error("Ambiguous builder registration.");
  }

  public getBuilder(state: BuildState) {
    const BuilderImpl = this.getBuilderImplementation(state);
    return (BuilderImpl != null) ? new BuilderImpl() : null;
  }

  public async checkRuntimeDependencies() {
    const builders = this.getAllBuilders();
    for (const BuilderImpl of builders) {
      const builder = new BuilderImpl();
      await builder.checkRuntimeDependencies();
    }
  }

  public getAllBuilders() {
    const moduleDir = this.getModuleDirPath();
    const entries = fs.readdirSync(moduleDir);
    const builders = entries.map((entry) => require(path.join(moduleDir, entry)).default);

    return builders;
  }

  public getModuleDirPath() {
    return path.join(__dirname, "builders");
  }
}
