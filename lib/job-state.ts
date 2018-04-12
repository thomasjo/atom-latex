import BuildState from './build-state'

export default class JobState {
  parent: BuildState
  jobName: string
  outputFilePath: string | null = null
  fileDatabase: any
  logMessages: string[] | null = null

  constructor (parent: BuildState, jobName: string) {
    this.parent = parent
    this.jobName = jobName
  }

  getOutputFilePath () {
    return this.outputFilePath
  }

  setOutputFilePath (value: string) {
    this.outputFilePath = value
  }

  getFileDatabase () {
    return this.fileDatabase
  }

  setFileDatabase (value: any) {
    this.fileDatabase = value
  }

  getLogMessages () {
    return this.logMessages
  }

  setLogMessages (value: string[]) {
    this.logMessages = value
  }

  getJobName () {
    return this.jobName
  }

  getFilePath () {
    return this.parent.getFilePath()
  }

  getProjectPath () {
    return this.parent.getProjectPath()
  }

  getTexFilePath () {
    return this.parent.getTexFilePath()
  }

  setTexFilePath (value: string | null) {
    this.parent.setTexFilePath(value)
  }

  getKnitrFilePath () {
    return this.parent.getKnitrFilePath()
  }

  setKnitrFilePath (value: string | null) {
    this.parent.setKnitrFilePath(value)
  }

  getCleanPatterns () {
    return this.parent.getCleanPatterns()
  }

  getEnableSynctex () {
    return this.parent.getEnableSynctex()
  }

  getEnableShellEscape () {
    return this.parent.getEnableShellEscape()
  }

  getEnableExtendedBuildMode () {
    return this.parent.getEnableExtendedBuildMode()
  }

  getEngine () {
    return this.parent.getEngine()
  }

  getMoveResultToSourceDirectory () {
    return this.parent.getMoveResultToSourceDirectory()
  }

  getOutputDirectory () {
    return this.parent.getOutputDirectory()
  }

  getOutputFormat () {
    return this.parent.getOutputFormat()
  }

  getProducer () {
    return this.parent.getProducer()
  }

  getShouldRebuild () {
    return this.parent.getShouldRebuild()
  }
}
