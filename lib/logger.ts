import { CompositeDisposable, Disposable, Emitter, Point } from "atom";
import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";

import LogDock from "./views/log-dock";
import { getEditorDetails } from "./werkzeug";

export default class Logger extends Disposable {
  public disposables = new CompositeDisposable();
  public emitter = new Emitter();
  public loggingLevel: any;
  public container: HTMLDivElement;
  public messages: any[];

  constructor() {
    super(() => this.disposables.dispose());

    this.disposables.add(this.emitter);

    this.loggingLevel = atom.config.get("latex.loggingLevel");
    this.disposables.add(atom.config.onDidChange("latex.loggingLevel", () => {
      this.loggingLevel = atom.config.get("latex.loggingLevel");
      this.refresh();
    }));

    this.container = document.createElement("div");
    this.disposables.add(atom.workspace.addOpener((uri) => {
      if (uri === LogDock.LOG_DOCK_URI) {
        const { filePath, position } = this.getEditorDetails();
        return this.renderLogDockElement(filePath!, position!);
      }
    }));

    this.messages = [];
  }

  public getEditorDetails() {
    return getEditorDetails();
  }

  public renderLogDockElement(filePath: string, position: Point) {
    const logDockElement = React.createElement(LogDock, {
      filePath,
      position,
    });

    return ReactDOM.render(logDockElement, this.container);
  }

  public onMessages(callback: any) {
    return this.emitter.on("messages", callback);
  }

  public error(text: string, filePath?: string, range?: any, logPath?: any, logRange?: any) {
    this.showMessages([{ type: "error", text, filePath, range, logPath, logRange }]);
  }

  public warning(text: string, filePath?: string, range?: any, logPath?: any, logRange?: any) {
    this.showMessages([{ type: "warning", text, filePath, range, logPath, logRange }]);
  }

  public info(text: string, filePath?: string, range?: any, logPath?: any, logRange?: any) {
    this.showMessages([{ type: "info", text, filePath, range, logPath, logRange }]);
  }

  public showMessages(messages: any[]) {
    messages = messages.map((message) => _.pickBy(message));
    this.messages = this.messages.concat(messages);

    const filteredMessages = messages.filter((message) => this.messageTypeIsVisible(message.type));

    if (filteredMessages.length > 0) {
      this.emitter.emit("messages", { messages: filteredMessages, reset: false });
    }
  }

  public clear() {
    this.messages = [];
    this.refresh();
  }

  public refresh() {
    this.emitter.emit("messages", { messages: this.getMessages(), reset: true });
  }

  public getMessages(useFilters = true) {
    return useFilters
      ? this.messages.filter((message) => this.messageTypeIsVisible(message.type))
      : this.messages;
  }

  public setMessages(messages: any) {
    this.messages = messages;
    this.emitter.emit("messages", { messages, reset: true });
  }

  public messageTypeIsVisible(type: string) {
    return type === "error" ||
      (this.loggingLevel !== "error" && type === "warning") ||
      (this.loggingLevel === "info" && type === "info");
  }

  public async sync() {
    // FIXME: There should be no direct interaction with editors. The required values should be arguments.
    const { filePath } = this.getEditorDetails();
    if (filePath) {
      await this.show();
    }
  }

  public async toggle() {
    await atom.workspace.toggle(LogDock.LOG_DOCK_URI);
  }

  public async show() {
    await atom.workspace.open(LogDock.LOG_DOCK_URI);
  }

  public hide() {
    atom.workspace.hide(LogDock.LOG_DOCK_URI);
  }
}
