/** @babel */

import path from 'path'
import Builder from '../builder'

const MISSING_PACKAGE_PATTERN = /there is no package called [‘']([^’']+)[’']/g
const OUTPUT_PATH_PATTERN = /\[\d+\]\s+"(.*)"/
const RSCRIPT_VERSION_PATTERN = /version\s+(\S+)/i

export default class KnitrBuilder extends Builder {
  executable = 'Rscript'

  static canProcess (filePath) {
    return path.extname(filePath) === '.Rnw'
  }

  async run (filePath, jobname, shouldRebuild) {
    const args = this.constructArgs(filePath)
    const directoryPath = path.dirname(filePath)
    const { statusCode, stdout, stderr } = await this.execRscript(directoryPath, args, 'error')
    if (statusCode !== 0) {
      this.logStatusCode(statusCode, stderr)
      return statusCode
    }

    const texFilePath = this.resolveOutputPath(filePath, stdout)
    const builder = latex.builderRegistry.getBuilder(texFilePath)
    const code = await builder.run(texFilePath, jobname, shouldRebuild)

    if (code === 0) {
      const outputDirectory = this.getOutputDirectory(filePath)
      if (outputDirectory) {
        const args = this.constructPatchSynctexArgs(texFilePath, jobname)
        await this.execRscript(directoryPath, args, 'warning')
      } else {
        latex.log.info('Using an output directory is not compatible with patchSynctex.')
      }
    }

    return code
  }

  async checkRuntimeDependencies () {
    const { statusCode, stderr } = await this.execRscript('.', ['--version'], 'warning')

    if (statusCode !== 0) {
      latex.log.warning(`Rscript check failed with code ${statusCode} and response of "${stderr}".`)
      return
    }

    const match = stderr.match(RSCRIPT_VERSION_PATTERN)

    if (!match) {
      latex.log.warning(`Rscript check succeeded but with an unknown version response of "${stderr}".`)
      return
    }

    const version = match[1]

    latex.log.info(`Rscript check succeeded. Found version ${version}.`)

    const result = await this.execRscript('.', ['-e "library(knitr)"', '-e "library(patchSynctex)"'], 'warning')
    if (result.statusCode === 0) {
      latex.log.info('knitr and patchSynctex libraries found.')
    }
  }

  async execRscript (directoryPath, args, type) {
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(directoryPath)

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

    return { statusCode, stdout, stderr }
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
}
