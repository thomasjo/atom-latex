'use babel'

import childProcess from 'child_process'
import path from 'path'
import Builder from '../builder'
import BuilderRegistry from '../builder-registry'

export default class KnitrBuilder extends Builder {
  executable = 'Rscript'

  constructor () {
    super()
    this.builderRegistry = new BuilderRegistry()
  }

  static canProcess (filePath) {
    return path.extname(filePath) === '.Rnw'
  }

  run (filePath) {
    const args = this.constructArgs(filePath)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions()

    return new Promise((resolve) => {
      childProcess.exec(command, options, (error, stdout, stderr) => {
        if (error) {
          // TODO: Parse output to detect missing 'knitr' library.
          resolve(error.code)
        }

        // TODO: Make this more robust.
        const texFilePath = /\[1\]\s+"(.*)"/.exec(stdout)[1]

        const builder = this.getResultBuilder(texFilePath)
        builder.run(texFilePath).then((code) => resolve(code))
      })
    })
  }

  constructArgs (filePath) {
    const outputFilePath = this.resolveOutputPath(filePath)
    const args = [
      '--default-packages=knitr',
      `-e "knit('${filePath}', '${outputFilePath}')"`
    ]

    return args
  }

  resolveOutputPath (filePath) {
    // TODO: Add support for `latex.outputDirectory`.
    return filePath.replace(/\.Rnw$/, '.tex')
  }

  // TODO: Move into base class, or perhaps introduce some new build pipeline concept?
  getResultBuilder (filePath) {
    const BuilderImpl = this.builderRegistry.getBuilder(filePath)
    return new BuilderImpl()
  }
}
