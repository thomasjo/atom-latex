/* @flow */

import path from 'path'
// $FlowIgnore
import { isTexFile, isKnitrFile } from './werkzeug'

function toArray (value: any): Array<string> {
  return (typeof value === 'string') ? value.split(',').map(item => item.trim()) : Array.from(value)
}

function toBoolean (value: any): boolean {
  return (typeof value === 'string') ? !!value.match(/^(true|yes)$/i) : !!value
}

export class JobState {
  parent: BuildState
  jobName: string
  outputFilePath: string
  filePath: string
  fileDatabase: Object
  logMessages: Array<Object>

  constructor (parent: BuildState, jobName: string) {
    this.parent = parent
    this.jobName = jobName
  }

  getOutputFilePath (): string {
    return this.outputFilePath
  }

  setOutputFilePath (value: string) {
    this.outputFilePath = value
  }

  getFileDatabase (): Object {
    return this.fileDatabase
  }

  setFileDatabase (value: Object) {
    this.fileDatabase = value
  }

  getLogMessages (): Array<Object> {
    return this.logMessages
  }

  setLogMessages (value: Array<Object>) {
    this.logMessages = value
  }

  getJobName (): string {
    return this.jobName
  }

  getFilePath (): string {
    return this.parent.getFilePath()
  }

  getProjectPath (): string {
    return this.parent.getProjectPath()
  }

  getTexFilePath (): string {
    return this.parent.getTexFilePath()
  }

  setTexFilePath (value: string) {
    this.parent.setTexFilePath(value)
  }

  getKnitrFilePath (): string {
    return this.parent.getKnitrFilePath()
  }

  setKnitrFilePath (value: string) {
    this.parent.setKnitrFilePath(value)
  }

  getCleanPatterns (): Array<string> {
    return this.parent.getCleanPatterns()
  }

  getEnableSynctex (): boolean {
    return this.parent.getEnableSynctex()
  }

  getEnableShellEscape (): boolean {
    return this.parent.getEnableShellEscape()
  }

  getEnableExtendedBuildMode (): boolean {
    return this.parent.getEnableExtendedBuildMode()
  }

  getEngine (): string {
    return this.parent.getEngine()
  }

  getMoveResultToSourceDirectory (): boolean {
    return this.parent.getMoveResultToSourceDirectory()
  }

  getOutputDirectory (): string {
    return this.parent.getOutputDirectory()
  }

  getOutputFormat (): string {
    return this.parent.getOutputFormat()
  }

  getProducer (): string {
    return this.parent.getProducer()
  }

  getShouldRebuild (): boolean {
    return this.parent.getShouldRebuild()
  }
}

export class BuildState {
  cleanPatterns: Array<string>
  enableExtendedBuildMode: boolean = false
  enableShellEscape: boolean = false
  enableSynctex: boolean = false
  engine: string
  filePath: string
  jobStates: Array<JobState>
  knitrFilePath: string
  moveResultToSourceDirectory: boolean = false
  outputDirectory: string
  outputFormat: string
  producer: string
  projectPath: string
  shouldRebuild: boolean
  subfiles: Set<string> = new Set()
  texFilePath: string

  constructor (filePath: string, jobNames: Array<string> = [''], shouldRebuild: boolean = false) {
    this.setFilePath(filePath)
    this.setJobNames(jobNames)
    this.setShouldRebuild(shouldRebuild)
  }

  getKnitrFilePath (): string {
    return this.knitrFilePath
  }

  setKnitrFilePath (value: string) {
    this.knitrFilePath = value
  }

  getTexFilePath (): string {
    return this.texFilePath
  }

  setTexFilePath (value: string) {
    this.texFilePath = value
  }

  getProjectPath (): string {
    return this.projectPath
  }

  setProjectPath (value: string) {
    this.projectPath = value
  }

  getCleanPatterns (): Array<string> {
    return this.cleanPatterns
  }

  setCleanPatterns (value: Array<string>) {
    this.cleanPatterns = toArray(value)
  }

  getEnableSynctex (): boolean {
    return this.enableSynctex
  }

  setEnableSynctex (value: boolean) {
    this.enableSynctex = toBoolean(value)
  }

  getEnableShellEscape (): boolean {
    return this.enableShellEscape
  }

  setEnableShellEscape (value: boolean) {
    this.enableShellEscape = toBoolean(value)
  }

  getEnableExtendedBuildMode (): boolean {
    return this.enableExtendedBuildMode
  }

  setEnableExtendedBuildMode (value: boolean) {
    this.enableExtendedBuildMode = toBoolean(value)
  }

  getEngine (): string {
    return this.engine
  }

  setEngine (value: string) {
    this.engine = value
  }

  getJobStates (): Array<JobState> {
    return this.jobStates
  }

  setJobStates (value: Array<JobState>) {
    this.jobStates = value
  }

  getMoveResultToSourceDirectory (): boolean {
    return this.moveResultToSourceDirectory
  }

  setMoveResultToSourceDirectory (value: boolean) {
    this.moveResultToSourceDirectory = toBoolean(value)
  }

  getOutputFormat (): string {
    return this.outputFormat
  }

  setOutputFormat (value: string) {
    this.outputFormat = value
  }

  getOutputDirectory (): string {
    return this.outputDirectory
  }

  setOutputDirectory (value: string) {
    this.outputDirectory = value
  }

  getProducer (): string {
    return this.producer
  }

  setProducer (value: string) {
    this.producer = value
  }

  getSubfiles (): Array<string> {
    return Array.from(this.subfiles.values())
  }

  addSubfile (value: string) {
    this.subfiles.add(value)
  }

  hasSubfile (value: string): boolean {
    return this.subfiles.has(value)
  }

  getShouldRebuild (): boolean {
    return this.shouldRebuild
  }

  setShouldRebuild (value: boolean) {
    this.shouldRebuild = toBoolean(value)
  }

  getFilePath (): string {
    return this.filePath
  }

  setFilePath (value: string) {
    this.filePath = value
    if (isTexFile(value)) {
      this.texFilePath = value
      delete this.knitrFilePath
    } else if (isKnitrFile(value)) {
      this.knitrFilePath = value
      delete this.texFilePath
    } else {
      delete this.knitrFilePath
      delete this.texFilePath
    }
    this.projectPath = path.dirname(value)
  }

  getJobNames (): Array<string> {
    return this.jobStates.map((jobState: JobState): string => jobState.getJobName())
  }

  setJobNames (value: Array<string>) {
    this.jobStates = toArray(value).map((jobName: string): JobState => new JobState(this, jobName))
  }
}
