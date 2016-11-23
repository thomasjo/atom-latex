/** @babel */

import path from 'path'
import { isTexFile, isKnitrFile } from './werkzeug'

class JobState {
  constructor (parent, jobname) {
    this.__parent = parent
    this.__jobname = jobname
  }

  getOutputFilePath () {
    return this.__outputFilePath
  }

  setOutputFilePath (value) {
    this.__outputFilePath = value
  }

  getFileDatabase () {
    return this.__fileDatabase
  }

  setFileDatabase (value) {
    this.__fileDatabase = value
  }

  getLogMessages () {
    return this.__logMessages
  }

  setLogMessages (value) {
    this.__logMessages = value
  }

  getJobName () {
    return this.__jobname
  }

  getFilePath () {
    return this.__parent.getFilePath()
  }

  getProjectPath () {
    return this.__parent.getProjectPath()
  }

  getTexFilePath () {
    return this.__parent.getTexFilePath()
  }

  setTexFilePath (value) {
    this.__parent.setTexFilePath(value)
  }

  getKnitrFilePath () {
    return this.__parent.getKnitrFilePath()
  }

  setKnitrFilePath (value) {
    this.__parent.setKnitrFilePath(value)
  }

  getCleanPatterns () {
    return this.__parent.getCleanPatterns()
  }

  getEnableSynctex () {
    return this.__parent.getEnableSynctex()
  }

  getEnableShellEscape () {
    return this.__parent.getEnableShellEscape()
  }

  getEnableExtendedBuildMode () {
    return this.__parent.getEnableExtendedBuildMode()
  }

  getEngine () {
    return this.__parent.getEngine()
  }

  getOutputDirectory () {
    return this.__parent.getOutputDirectory()
  }

  getOutputFormat () {
    return this.__parent.getOutputFormat()
  }

  getProducer () {
    return this.__parent.getProducer()
  }

  getShouldRebuild () {
    return this.__parent.getShouldRebuild()
  }
}

export default class BuildState {
  constructor (filePath, jobnames = [null], shouldRebuild = false) {
    this.setFilePath(filePath)
    this.setJobNames(jobnames)
    this.setShouldRebuild(shouldRebuild)
    this.setEnableSynctex(false)
    this.setEnableShellEscape(false)
    this.setEnableExtendedBuildMode(false)
    this.__subfiles = new Set()
  }

  getKnitrFilePath () {
    return this.__knitrFilePath
  }

  setKnitrFilePath (value) {
    this.__knitrFilePath = value
  }

  getTexFilePath () {
    return this.__texFilePath
  }

  setTexFilePath (value) {
    this.__texFilePath = value
  }

  getProjectPath () {
    return this.__projectPath
  }

  setProjectPath (value) {
    this.__projectPath = value
  }

  getCleanPatterns () {
    return this.__cleanPatterns
  }

  setCleanPatterns (value) {
    this.__cleanPatterns = value
  }

  getEnableSynctex () {
    return this.__enableSynctex
  }

  setEnableSynctex (value) {
    this.__enableSynctex = value
  }

  getEnableShellEscape () {
    return this.__enableShellEscape
  }

  setEnableShellEscape (value) {
    this.__enableShellEscape = value
  }

  getEnableExtendedBuildMode () {
    return this.__enableExtendedBuildMode
  }

  setEnableExtendedBuildMode (value) {
    this.__enableExtendedBuildMode = value
  }

  getEngine () {
    return this.__engine
  }

  setEngine (value) {
    this.__engine = value
  }

  getJobStates () {
    return this.__jobStates
  }

  setJobStates (value) {
    this.__jobStates = value
  }

  getOutputFormat () {
    return this.__outputFormat
  }

  setOutputFormat (value) {
    this.__outputFormat = value
  }

  getOutputDirectory () {
    return this.__outputDirectory
  }

  setOutputDirectory (value) {
    this.__outputDirectory = value
  }

  getProducer () {
    return this.__producer
  }

  setProducer (value) {
    this.__producer = value
  }

  getSubfiles () {
    return this.__subfiles.values()
  }

  addSubfile (value) {
    this.__subfiles.add(value)
  }

  getShouldRebuild () {
    return this.__shouldRebuild
  }

  setShouldRebuild (value) {
    this.__shouldRebuild = value
  }

  getFilePath () {
    return this.__filePath
  }

  setFilePath (value) {
    this.__filePath = value
    this.__texFilePath = isTexFile(value) ? value : undefined
    this.__knitrFilePath = isKnitrFile(value) ? value : undefined
    this.__projectPath = path.dirname(value)
  }

  getJobNames () {
    return this.__jobStates.map(jobState => jobState.getJobName())
  }

  setJobNames (value) {
    this.__jobStates = value.map(jobname => new JobState(this, jobname))
  }
}
