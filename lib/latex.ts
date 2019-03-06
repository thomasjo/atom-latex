import { CompositeDisposable, Disposable } from "atom";

import BuilderRegistry from "./builder-registry";
import Composer from "./composer";
import Logger from "./logger";
import OpenerRegistry from "./opener-registry";
import ProcessManager from "./process-manager";
import StatusIndicator from "./status-indicator";

function defineImmutableProperty(obj: Latex, name: string, value: any) {
  if (Disposable.isDisposable(value)) {
    obj.disposables.add(value);
  }
  Object.defineProperty(obj, name, { value });
}

export default class Latex extends Disposable {
  public disposables = new CompositeDisposable();

  constructor() {
    super(() => this.disposables.dispose());

    defineImmutableProperty(this, "builderRegistry", new BuilderRegistry());
    defineImmutableProperty(this, "composer", new Composer());
    defineImmutableProperty(this, "log", new Logger());
    defineImmutableProperty(this, "opener", new OpenerRegistry());
    defineImmutableProperty(this, "process", new ProcessManager());
    defineImmutableProperty(this, "status", new StatusIndicator());
  }
}
