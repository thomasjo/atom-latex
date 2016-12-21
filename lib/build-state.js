/** @babel */

export default class BuildState {
  constructor (filePath, projectPath) {
    this.filePath = filePath
    this.projectPath = projectPath
    this.stages = []
    this.stageOutputs = {}
  }

  getFilePath () {
    return this.filePath
  }

  getProjectPath () {
    return this.projectPath
  }

  getOutputFormat () {
    return this.outputFormat
  }

  setOutputFormat (value) {
    this.outputFormat = value
  }

  getOutputDirectory () {
    return this.outputDirectory
  }

  setOutputDirectory (value) {
    this.outputDirectory = value
  }

  getJobnames () {
    return this.jobnames
  }

  setJobnames (value) {
    this.jobnames = value
  }

  getActiveJobname () {
    return this.activeJobname
  }

  setActiveJobname (value) {
    this.activeJobname = value
  }

  getCurrentStage () {
    return this.stages[0]
  }

  shiftStage () {
    return this.stages.shift()
  }

  pushStages (...newStages) {
    Array.prototype.push.apply(this.stages, newStages)
  }

  getStageOutputs (stage) {
    return this.stageOutputs[stage]
  }

  setStageOutputs (stage, outputs) {
    this.stageOutputs[stage] = outputs
  }

  getLatexEngine () {
    return this.latexEngine
  }

  setLatexEngine (value) {
    this.latexEngine = value
  }

  getPdfProducer () {
    return this.pdfProducer
  }

  setPdfProducer (value) {
    this.pdfProducer = value
  }
}
