'use babel'

import childProcess from 'child_process'
import path from 'path'
import Builder from '../builder'

export default class KnitrBuilder extends Builder {
  constructor () {
    super()
    this.executable = 'Rscript'
  }

  static canProcess (filePath) {
    return path.extname(filePath) === '.Rnw'
  }

  run (filePath) {
    const args = this.constructArgs(filePath)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions()

    return new Promise((resolve) => {
      childProcess.exec(command, options, (error) => {
        // TODO: Parse output to detect missing 'knitr' library.
        // TODO: Parse output to get the path to the resulting .tex file.
        // TODO: Execute default builder on resulting .tex file.
        resolve((error) ? error.code : 0)
      })
    })
  }

  constructArgs (filePath) {
    const args = [
      '--default-packages=knitr',
      `-e "knit('${filePath}')"`
    ]

    return args
  }
}
