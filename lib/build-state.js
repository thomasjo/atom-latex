/** @babel */

import path from 'path'
import { isTexFile, isKnitrFile } from './werkzeug'

function toArray (value) {
  return (typeof value === 'string') ? value.split(',').map(item => item.trim()) : Array.from(value)
}

function toBoolean (value) {
  return (typeof value === 'string') ? !!value.match(/^(true|yes)$/i) : !!value
}

class JobState {
  constructor (parent, jobName) {
    this.parent = parent
    this.jobName = jobName
  }

  getOutputFilePath () {
    return this.outputFilePath
  }

  setOutputFilePath (value) {
    this.outputFilePath = value
  }

  getFileDatabase () {
    return this.fileDatabase
  }

  setFileDatabase (value) {
    this.fileDatabase = value
  }

  getLogMessages () {
    return this.logMessages
  }

  setLogMessages (value) {
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

  setTexFilePath (value) {
    this.parent.setTexFilePath(value)
  }

  getKnitrFilePath () {
    return this.parent.getKnitrFilePath()
  }

  setKnitrFilePath (value) {
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

export default class BuildState {
  constructor (filePath, jobNames = [null], shouldRebuild = false) {
    this.setFilePath(filePath)
    this.setJobNames(jobNames)
    this.setShouldRebuild(shouldRebuild)
    this.setEnableSynctex(false)
    this.setEnableShellEscape(false)
    this.setEnableExtendedBuildMode(false)
    this.subfiles = new Set()
  }

  getKnitrFilePath () {
    return this.knitrFilePath
  }

  setKnitrFilePath (value) {
    this.knitrFilePath = value
  }

  getTexFilePath () {
    return this.texFilePath
  }

  setTexFilePath (value) {
    this.texFilePath = value
  }

  getProjectPath () {
    return this.projectPath
  }

  setProjectPath (value) {
    this.projectPath = value
  }

  getCleanPatterns () {
    return this.cleanPatterns
  }

  setCleanPatterns (value) {
    this.cleanPatterns = toArray(value)
  }

  getEnableSynctex () {
    return this.enableSynctex
  }

  setEnableSynctex (value) {
    this.enableSynctex = toBoolean(value)
  }

  getEnableShellEscape () {
    return this.enableShellEscape
  }

  setEnableShellEscape (value) {
    this.enableShellEscape = toBoolean(value)
  }

  getEnableExtendedBuildMode () {
    return this.enableExtendedBuildMode
  }

  setEnableExtendedBuildMode (value) {
    this.enableExtendedBuildMode = toBoolean(value)
  }

  getEngine () {
    return this.engine
  }

  setEngine (value) {
    this.engine = value
  }

  getJobStates () {
    return this.jobStates
  }

  setJobStates (value) {
    this.jobStates = value
  }

  getMoveResultToSourceDirectory () {
    return this.moveResultToSourceDirectory
  }

  setMoveResultToSourceDirectory (value) {
    this.moveResultToSourceDirectory = toBoolean(value)
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

  getProducer () {
    return this.producer
  }

  setProducer (value) {
    this.producer = value
  }

  getSubfiles () {
    return Array.from(this.subfiles.values())
  }

  addSubfile (value) {
    this.subfiles.add(value)
  }

  hasSubfile (value) {
    return this.subfiles.has(value)
  }

  getShouldRebuild () {
    return this.shouldRebuild
  }

  setShouldRebuild (value) {
    this.shouldRebuild = toBoolean(value)
  }

  getFilePath () {
    return this.filePath
  }

  setFilePath (value) {
    this.filePath = value
    this.texFilePath = isTexFile(value) ? value : undefined
    this.knitrFilePath = isKnitrFile(value) ? value : undefined
    this.projectPath = path.dirname(value)
  }

  getJobNames () {
    return this.jobStates.map(jobState => jobState.getJobName())
  }

  setJobNames (value) {
    this.jobStates = toArray(value).map(jobName => new JobState(this, jobName))
  }
}
