/** @babel */

import path from 'path'
import Builder from '../builder'

const MISSING_PACKAGE_PATTERN = /there is no package called [‘']([^’']+)[’']/g
const OUTPUT_PATH_PATTERN = /\[\d+]\s+"(.*)"/
const RSCRIPT_VERSION_PATTERN = /version\s+(\S+)/i

export default class KnitrBuilder extends Builder {
  executable = 'Rscript'

  static canProcess (filePath) {
    return path.extname(filePath) === '.Rnw'
  }

  async run (state) {
    const args = this.constructArgs(state)
    const { statusCode, stdout, stderr } = await this.execRscript(state.projectPath, args, 'error')
    if (statusCode !== 0) {
      this.logStatusCode(statusCode, stderr)
      return statusCode
    }

    state.texFilePath = this.resolveOutputPath(state.knitrFilePath, stdout)
    const builder = latex.builderRegistry.getBuilder(state.texFilePath)
    const code = await builder.run(state)

    if (code === 0) {
      if (state.outputDirectory) {
        latex.log.info('Using an output directory is not compatible with patchSynctex.')
      } else {
        const args = this.constructPatchSynctexArgs(state)
        await this.execRscript(state.projectPath, args, 'warning')
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

  constructArgs (state) {
    const args = [
      '-e "library(knitr)"',
      '-e "opts_knit$set(concordance = TRUE)"',
      `-e "knit('${state.knitrFilePath.replace(/\\/g, '\\\\')}')"`
    ]

    return args
  }

  constructPatchSynctexArgs (state) {
    const args = [
      '-e "library(patchSynctex)"',
      `-e "patchSynctex('${state.knitrFilePath.replace(/\\/g, '\\\\')}')"`
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
