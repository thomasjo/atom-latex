import BuildState from "./build-state";

export default class JobState {
  public parent: BuildState;
  public jobName: string;
  public outputFilePath: string | null = null;
  public fileDatabase: any;
  public logMessages: string[] | null = null;

  constructor(parent: BuildState, jobName: string) {
    this.parent = parent;
    this.jobName = jobName;
  }

  public getOutputFilePath() {
    return this.outputFilePath;
  }

  public setOutputFilePath(value: string) {
    this.outputFilePath = value;
  }

  public getFileDatabase() {
    return this.fileDatabase;
  }

  public setFileDatabase(value: any) {
    this.fileDatabase = value;
  }

  public getLogMessages() {
    return this.logMessages;
  }

  public setLogMessages(value: string[]) {
    this.logMessages = value;
  }

  public getJobName() {
    return this.jobName;
  }

  public getFilePath() {
    return this.parent.getFilePath();
  }

  public getProjectPath() {
    return this.parent.getProjectPath();
  }

  public getTexFilePath() {
    return this.parent.getTexFilePath();
  }

  public setTexFilePath(value: string | null) {
    this.parent.setTexFilePath(value);
  }

  public getKnitrFilePath() {
    return this.parent.getKnitrFilePath();
  }

  public setKnitrFilePath(value: string | null) {
    this.parent.setKnitrFilePath(value);
  }

  public getCleanPatterns() {
    return this.parent.getCleanPatterns();
  }

  public getEnableSynctex() {
    return this.parent.getEnableSynctex();
  }

  public getEnableShellEscape() {
    return this.parent.getEnableShellEscape();
  }

  public getEnableExtendedBuildMode() {
    return this.parent.getEnableExtendedBuildMode();
  }

  public getEngine() {
    return this.parent.getEngine();
  }

  public getMoveResultToSourceDirectory() {
    return this.parent.getMoveResultToSourceDirectory();
  }

  public getOutputDirectory() {
    return this.parent.getOutputDirectory();
  }

  public getOutputFormat() {
    return this.parent.getOutputFormat();
  }

  public getProducer() {
    return this.parent.getProducer();
  }

  public getShouldRebuild() {
    return this.parent.getShouldRebuild();
  }
}
