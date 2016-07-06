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
    const options = this.constructChildProcessOptions(filePath)

    return new Promise((resolve) => {
      childProcess.exec(command, options, (error, stdout, stderr) => {
        if (error) {
          // Parse error message to detect missing 'knitr' library.
          if (stderr.match(/there is no package called ‘knitr’/)) {
            latex.log.error('Knitr package missing')
            return resolve(-1)
          }

          return resolve(error.code)
        }

        // TODO: Make this more robust.
        const texFilePath = this.resolveOutputPath(filePath, stdout)
        const builder = this.getResultBuilder(texFilePath)
        return builder.run(texFilePath).then((code) => resolve(code))
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

  resolveOutputPath (sourcePath, stdout) {
    const candidatePath = /\[1\]\s+"(.*)"/.exec(stdout)[1]
    if (path.isAbsolute(candidatePath)) {
      return candidatePath
    }

    const sourceDir = path.dirname(sourcePath)
    return path.join(sourceDir, candidatePath)
  }

  // TODO: Move into base class, or perhaps introduce some new build pipeline concept?
  getResultBuilder (filePath) {
    const BuilderImpl = this.builderRegistry.getBuilder(filePath)
    return new BuilderImpl()
  }
}
