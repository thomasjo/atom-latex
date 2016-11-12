/** @babel */

import path from 'path'

class JobState {
  constructor (parent, jobname) {
    Object.defineProperties(this, {
      jobname: {
        enumerable: true,
        value: jobname
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
      filePath: {
        enumerable: true,
        writable: true,
        value: filePath
      },
      knitrfilePath: {
        enumerable: true,
        writable: true
      },
      texFilePath: {
        enumerable: true,
        writable: true
      },
      engine: {
        enumerable: true,
        writable: true
      },
      jobStates: {
        enumerable: true,
        writable: true
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
      shouldRebuild: {
        enumerable: true,
        writable: true,
        value: shouldRebuild
      }
    })
    this.jobnames = jobnames
    Object.seal(this)
  }

  get projectPath () {
    return path.dirname(this.filePath)
  }

  set jobnames (value) {
    this.jobStates = value.map(jobname => new JobState(this, jobname))
  }
}
