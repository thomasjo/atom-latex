/** @babel */

import path from 'path'
import { isTexFile, isKnitrFile } from './werkzeug'

class JobState {
  constructor (parent, jobname) {
    Object.defineProperties(this, {
      jobname: {
        enumerable: true,
        value: jobname
      },
      outputFilePath: {
        enumerable: true,
        writable: true
      },
      logFilePath: {
        enumerable: true,
        writable: true
      },
      messages: {
        enumerable: true,
        writable: true
      },
      fdb: {
        enumerable: true,
        writable: true
      },
      parent: {
        value: parent
      }
    })
    Object.seal(this)
  }

  get filePath () {
    return this.parent.filePath
  }

  get projectPath () {
    return this.parent.projectPath
  }

  get texFilePath () {
    return this.parent.texFilePath
  }

  set texFilePath (value) {
    this.parent.texFilePath = value
  }

  get knitrFilePath () {
    return this.parent.knitrFilePath
  }

  set knitrFilePath (value) {
    this.parent.knitrFilePath = value
  }

  get enableSynctex () {
    return this.parent.enableSynctex
  }

  get enableShellEscape () {
    return this.parent.enableShellEscape
  }

  get enableExtendedBuildMode () {
    return this.parent.enableExtendedBuildMode
  }

  get engine () {
    return this.parent.engine
  }

  get outputDirectory () {
    return this.parent.outputDirectory
  }

  get outputFormat () {
    return this.parent.outputFormat
  }

  get producer () {
    return this.parent.producer
  }

  get shouldRebuild () {
    return this.parent.shouldRebuild
  }
}

export default class BuildState {
  constructor (filePath, jobnames = [null], shouldRebuild = false) {
    Object.defineProperties(this, {
      knitrfilePath: {
        enumerable: true,
        writable: true
      },
      texFilePath: {
        enumerable: true,
        writable: true
      },
      projectPath: {
        enumerable: true,
        writable: true
      },
      enableSynctex: {
        enumerable: true,
        writable: true,
        value: false
      },
      enableShellEscape: {
        enumerable: true,
        writable: true,
        value: false
      },
      enableExtendedBuildMode: {
        enumerable: true,
        writable: true,
        value: false
      },
      engine: {
        enumerable: true,
        writable: true
      },
      jobStates: {
        enumerable: true,
        writable: true,
        value: []
      },
      outputFormat: {
        enumerable: true,
        writable: true
      },
      outputDirectory: {
        enumerable: true,
        writable: true
      },
      producer: {
        enumerable: true,
        writable: true
      },
      subfiles: {
        enumerable: true,
        value: new Set()
      },
      shouldRebuild: {
        enumerable: true,
        writable: true,
        value: shouldRebuild
      }
    })
    this.filePath = filePath
    this.jobnames = jobnames
    Object.seal(this)
  }

  get filePath () {
    return this.__filePath
  }

  set filePath (value) {
    this.__filePath = value
    this.texFilePath = isTexFile(value) ? value : undefined
    this.knitrFilePath = isKnitrFile(value) ? value : undefined
    this.projectPath = path.dirname(value)
  }

  get jobnames () {
    return this.jobStates.map(jobState => jobState.jobname)
  }

  set jobnames (value) {
    this.jobStates = value.map(jobname => new JobState(this, jobname))
  }
}
