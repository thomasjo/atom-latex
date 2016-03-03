'use babel'

import child_process from 'child_process'
import path from 'path'
import Builder from '../builder'

export default class KnitrBuilder extends Builder {
  constructor () {
    super()
    this.executable = 'Rscript'
  }

  run (filePath) {
    const args = this.constructArgs(filePath)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions()

    options.cwd = path.dirname(filePath)
    options.maxBuffer = 52428800

    return new Promise((resolve) => {
      child_process.exec(command, options, (error) => {
        resolve((error) ? error.code : 0)
      })
    })
  }

  constructArgs (filePath) {
    const args = [
      `-e "library(knitr); knit("${filePath}")"`
    ]

    return args
  }
}
