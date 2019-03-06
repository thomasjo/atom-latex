import { CompositeDisposable, Disposable } from "atom";

export default class MarkerManager extends Disposable {
  public editor: any;
  public markers: any[];
  public disposables = new CompositeDisposable();

  constructor(editor: any) {
    super(() => this.disposables.dispose());

    this.editor = editor;
    this.markers = [];

    this.disposables.add(latex.log.onMessages(({ messages, reset }: any) => this.addMarkers(messages, reset)));
    this.disposables.add(new Disposable(() => this.clear()));
    this.disposables.add(this.editor.onDidDestroy(() => this.dispose()));
    this.disposables.add(atom.config.onDidChange("latex.loggingLevel", () => this.update()));

    this.addMarkers(latex.log.getMessages());
  }

  public update() {
    this.addMarkers(latex.log.getMessages(), true);
  }

  public addMarkers(messages: any[], reset?: boolean) {
    if (reset) { this.clear(); }

    const editorPath = this.editor.getPath();
    const isVisible = (filePath: string, range: any) => filePath && range && editorPath.includes(filePath);

    if (editorPath) {
      for (const message of messages) {
        if (isVisible(message.filePath, message.range)) {
          this.addMarker(message.type, message.range);
        }
        if (isVisible(message.logPath, message.logRange)) {
          this.addMarker(message.type, message.logRange);
        }
      }
    }
  }

  public addMarker(type: string, range: any) {
    const marker = this.editor.markBufferRange(range, { invalidate: "touch" });
    this.editor.decorateMarker(marker, { type: "line-number", class: `latex-${type}` });
    this.markers.push(marker);
  }

  public clear() {
    for (const marker of this.markers) {
      marker.destroy();
    }
    this.markers = [];
  }
}
