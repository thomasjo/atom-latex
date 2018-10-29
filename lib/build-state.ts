import path from 'path'
import JobState from './job-state'
import { isTexFile, isKnitrFile } from './werkzeug'

function toArray (value: any): string[] {
  if (value === undefined || value == null) { return [] }
  return (typeof value === 'string') ? value.split(',').map(item => item.trim()) : Array.from(value)
}

function toBoolean (value: any): boolean {
  return (typeof value === 'string') ? !!value.match(/^(true|yes)$/i) : !!value
}

export default class BuildState {
  subfiles: Set<string> = new Set()
  knitrFilePath: string | null = null
  texFilePath: string | null = null
  projectPath: string | null = null
  cleanPatterns: string[] | null = null
  enableSynctex: boolean = false
  enableShellEscape: boolean = false
  enableExtendedBuildMode: boolean = false
  engine: any
  jobStates: JobState[] = []
  moveResultToSourceDirectory: boolean = false
  outputFormat: string | null = null
  outputDirectory: string | null = null
  producer: string | null = null
  shouldRebuild: boolean = false
  filePath: string

  // TODO: Revisit the default value for 'jobNames'.
  constructor (filePath: string, jobNames: string[] = [''], shouldRebuild = false) {
    this.filePath = filePath

    this.setFilePath(filePath)
    this.setJobNames(jobNames)
    this.setShouldRebuild(shouldRebuild)
    this.setEnableSynctex(false)
    this.setEnableShellEscape(false)
    this.setEnableExtendedBuildMode(false)
  }

  getKnitrFilePath () {
    return this.knitrFilePath
  }

  setKnitrFilePath (value: string | null) {
    this.knitrFilePath = value
  }

  getTexFilePath () {
    return this.texFilePath
  }

  setTexFilePath (value: string | null) {
    this.texFilePath = value
  }

  getProjectPath () {
    return this.projectPath
  }

  setProjectPath (value: string | null) {
    this.projectPath = value
  }

  getCleanPatterns () {
    return this.cleanPatterns
  }

  setCleanPatterns (value: string[] | null) {
    this.cleanPatterns = toArray(value)

  }
  getEnableSynctex () {
    return this.enableSynctex
  }

  setEnableSynctex (value: boolean) {
    this.enableSynctex = toBoolean(value)
  }

  getEnableShellEscape () {
    return this.enableShellEscape
  }

  setEnableShellEscape (value: boolean) {
    this.enableShellEscape = toBoolean(value)
  }

  getEnableExtendedBuildMode () {
    return this.enableExtendedBuildMode
  }

  setEnableExtendedBuildMode (value: boolean) {
    this.enableExtendedBuildMode = toBoolean(value)
  }

  getEngine () {
    return this.engine
  }

  setEngine (value: any) {
    this.engine = value
  }

  getJobStates () {
    return this.jobStates
  }

  setJobStates (value: JobState[]) {
    this.jobStates = value
  }

  getMoveResultToSourceDirectory () {
    return this.moveResultToSourceDirectory
  }

  setMoveResultToSourceDirectory (value: boolean) {
    this.moveResultToSourceDirectory = toBoolean(value)
  }

  getOutputFormat () {
    return this.outputFormat
  }

  setOutputFormat (value: string | null) {
    this.outputFormat = value
  }

  getOutputDirectory () {
    return this.outputDirectory
  }

  setOutputDirectory (value: string | null) {
    this.outputDirectory = value
  }

  getProducer () {
    return this.producer
  }

  setProducer (value: string | null) {
    this.producer = value
  }

  getSubfiles () {
    return Array.from(this.subfiles.values())
  }

  addSubfile (value: string) {
    this.subfiles.add(value)
  }

  hasSubfile (value: string) {
    return this.subfiles.has(value)
  }

  getShouldRebuild () {
    return this.shouldRebuild
  }

  setShouldRebuild (value: boolean) {
    this.shouldRebuild = toBoolean(value)
  }

  getFilePath () {
    return this.filePath
  }

  setFilePath (value: string) {
    this.filePath = value
    this.texFilePath = isTexFile(value) ? value : null
    this.knitrFilePath = isKnitrFile(value) ? value : null
    this.projectPath = value ? path.dirname(value) : null
  }

  getJobNames () {
    if (this.jobStates) {
      return this.jobStates.map(jobState => jobState.getJobName())
    }

    return []
  }

  setJobNames (value: string[] | null) {
    this.jobStates = toArray(value).map(jobName => new JobState(this, jobName))
  }
}
