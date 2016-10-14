/** @babel */

import path from 'path'
import Builder from '../builder'
import BuilderRegistry from '../builder-registry'

const MISSING_PACKAGE_PATTERN = /there is no package called [‘']([^’']+)[’']/g
const OUTPUT_PATH_PATTERN = /\[\d+\]\s+"(.*)"/

export default class KnitrBuilder extends Builder {
  executable = 'Rscript'

  constructor () {
    super()
    this.builderRegistry = new BuilderRegistry()
  }

  static canProcess (filePath) {
    return path.extname(filePath) === '.Rnw'
  }

  async run (filePath, jobname, shouldRebuild) {
    const args = this.constructArgs(filePath)
    const { statusCode, stdout } = await this.execRscript(filePath, args, 'Error')
    if (statusCode !== 0) return statusCode

    const texFilePath = this.resolveOutputPath(filePath, stdout)
    const builder = this.getResultBuilder(texFilePath)
    const code = await builder.run(texFilePath, jobname, shouldRebuild)

    if (code === 0) {
      const outputDirectory = atom.config.get('latex.outputDirectory')
      if (outputDirectory) {
        const args = this.constructPatchSynctexArgs(texFilePath, jobname)
        await this.execRscript(filePath, args, 'Warning')
      } else {
        latex.log.info('Using an output directory is not compatible with patchSynctex.')
      }
    }

    return code
  }

  async execRscript (filePath, args, type) {
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(filePath)

    let { statusCode, stdout, stderr } = await latex.process.executeChildProcess(command, options)

    if (statusCode !== 0) {
      // Parse error message to detect missing libraries.
      let match
      while ((match = MISSING_PACKAGE_PATTERN.exec(stderr)) !== null) {
        const text = `The R package "${match[1]}" could not be loaded.`
        latex.log.showMessage({ type, text })
        statusCode = -1
      }
    }

    return { statusCode, stdout }
  }

  constructArgs (filePath) {
    const args = [
      '-e "library(knitr)"',
      '-e "opts_knit$set(concordance = TRUE)"',
      `-e "knit('${filePath.replace(/\\/g, '\\\\')}')"`
    ]

    return args
  }

  constructPatchSynctexArgs (filePath, jobname) {
    const args = [
      '-e "library(patchSynctex)"',
      `-e "patchSynctex('${filePath.replace(/\\/g, '\\\\')}')"`
    ]

    return args
  }

  resolveOutputPath (sourcePath, stdout) {
    const candidatePath = OUTPUT_PATH_PATTERN.exec(stdout)[1]
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
