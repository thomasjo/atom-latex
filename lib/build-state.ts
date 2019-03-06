import path from "path";

import JobState from "./job-state";
import { isKnitrFile, isTexFile } from "./werkzeug";

function toArray(value: any): string[] {
  if (value === undefined || value == null) { return []; }
  return (typeof value === "string") ? value.split(",").map((item) => item.trim()) : Array.from(value);
}

function toBoolean(value: any): boolean {
  return (typeof value === "string") ? !!value.match(/^(true|yes)$/i) : !!value;
}

export default class BuildState {
  public subfiles: Set<string> = new Set();
  public knitrFilePath: string | null = null;
  public texFilePath: string | null = null;
  public projectPath: string | null = null;
  public cleanPatterns: string[] | null = null;
  public enableSynctex: boolean = false;
  public enableShellEscape: boolean = false;
  public enableExtendedBuildMode: boolean = false;
  public engine: any;
  public jobStates: JobState[] = [];
  public moveResultToSourceDirectory: boolean = false;
  public outputFormat: string | null = null;
  public outputDirectory: string | null = null;
  public producer: string | null = null;
  public shouldRebuild: boolean = false;
  public filePath: string;

  // TODO: Revisit the default value for 'jobNames'.
  constructor(filePath: string, jobNames: string[] = [""], shouldRebuild = false) {
    this.filePath = filePath;

    this.setFilePath(filePath);
    this.setJobNames(jobNames);
    this.setShouldRebuild(shouldRebuild);
    this.setEnableSynctex(false);
    this.setEnableShellEscape(false);
    this.setEnableExtendedBuildMode(false);
  }

  public getKnitrFilePath() {
    return this.knitrFilePath;
  }

  public setKnitrFilePath(value: string | null) {
    this.knitrFilePath = value;
  }

  public getTexFilePath() {
    return this.texFilePath;
  }

  public setTexFilePath(value: string | null) {
    this.texFilePath = value;
  }

  public getProjectPath() {
    return this.projectPath;
  }

  public setProjectPath(value: string | null) {
    this.projectPath = value;
  }

  public getCleanPatterns() {
    return this.cleanPatterns;
  }

  public setCleanPatterns(value: string[] | null) {
    this.cleanPatterns = toArray(value);

  }
  public getEnableSynctex() {
    return this.enableSynctex;
  }

  public setEnableSynctex(value: boolean) {
    this.enableSynctex = toBoolean(value);
  }

  public getEnableShellEscape() {
    return this.enableShellEscape;
  }

  public setEnableShellEscape(value: boolean) {
    this.enableShellEscape = toBoolean(value);
  }

  public getEnableExtendedBuildMode() {
    return this.enableExtendedBuildMode;
  }

  public setEnableExtendedBuildMode(value: boolean) {
    this.enableExtendedBuildMode = toBoolean(value);
  }

  public getEngine() {
    return this.engine;
  }

  public setEngine(value: any) {
    this.engine = value;
  }

  public getJobStates() {
    return this.jobStates;
  }

  public setJobStates(value: JobState[]) {
    this.jobStates = value;
  }

  public getMoveResultToSourceDirectory() {
    return this.moveResultToSourceDirectory;
  }

  public setMoveResultToSourceDirectory(value: boolean) {
    this.moveResultToSourceDirectory = toBoolean(value);
  }

  public getOutputFormat() {
    return this.outputFormat;
  }

  public setOutputFormat(value: string | null) {
    this.outputFormat = value;
  }

  public getOutputDirectory() {
    return this.outputDirectory;
  }

  public setOutputDirectory(value: string | null) {
    this.outputDirectory = value;
  }

  public getProducer() {
    return this.producer;
  }

  public setProducer(value: string | null) {
    this.producer = value;
  }

  public getSubfiles() {
    return Array.from(this.subfiles.values());
  }

  public addSubfile(value: string) {
    this.subfiles.add(value);
  }

  public hasSubfile(value: string) {
    return this.subfiles.has(value);
  }

  public getShouldRebuild() {
    return this.shouldRebuild;
  }

  public setShouldRebuild(value: boolean) {
    this.shouldRebuild = toBoolean(value);
  }

  public getFilePath() {
    return this.filePath;
  }

  public setFilePath(value: string) {
    this.filePath = value;
    this.texFilePath = isTexFile(value) ? value : null;
    this.knitrFilePath = isKnitrFile(value) ? value : null;
    this.projectPath = value ? path.dirname(value) : null;
  }

  public getJobNames() {
    if (this.jobStates) {
      return this.jobStates.map((jobState) => jobState.getJobName());
    }

    return [];
  }

  public setJobNames(value: string[] | null) {
    this.jobStates = toArray(value).map((jobName) => new JobState(this, jobName));
  }
}
