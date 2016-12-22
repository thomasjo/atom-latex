/** @babel */

import path from 'path'
import Builder from '../builder'

const MISSING_PACKAGE_PATTERN = /there is no package called [‘']([^’']+)[’']/g
const OUTPUT_PATH_PATTERN = /\[\d+]\s+"(.*)"/
const RSCRIPT_VERSION_PATTERN = /version\s+(\S+)/i

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class KnitrBuilder extends Builder {
  executable = 'Rscript'

  static canProcess (state) {
    return !state.getTexFilePath() && !!state.getKnitrFilePath()
  }

  async run (jobState) {
    const args = this.constructArgs(jobState)
    const { statusCode, stdout, stderr } = await this.execRscript(jobState.getProjectPath(), args, 'error')
    if (statusCode !== 0) {
      this.logStatusCode(statusCode, stderr)
      return statusCode
    }

    jobState.setTexFilePath(this.resolveOutputPath(jobState.getKnitrFilePath(), stdout))

    const builder = latex.builderRegistry.getBuilder(jobState)
    const code = await builder.run(jobState)

    if (code === 0 && jobState.getEnableSynctex()) {
      const args = this.constructPatchSynctexArgs(jobState)
      await this.execRscript(jobState.getProjectPath(), args, 'warning')
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

    const result = await this.execRscript('.', ['-e "installed.packages()"'], 'warning')
    if (result.statusCode === 0) {
      this.checkRscriptPackageVersion(result.stdout, 'knitr')
      this.checkRscriptPackageVersion(result.stdout, 'patchSynctex', '0.1-4')
    }
  }

  checkRscriptPackageVersion (stdout, packageName, minimumVersion) {
    const packagePattern = new RegExp(`^${packageName}\\s+"${packageName}"\\s+"[^"]*"\\s+"([^"]*)"`, 'm')
    const match = stdout.match(packagePattern)
    if (match) {
      const version = match[1]
      const message = `Rscript ${packageName} package check succeeded. Found version ${version}.`
      if (minimumVersion && minimumVersion > version) {
        latex.log.warning(`${message} Minimum version ${minimumVersion} needed.`)
      } else {
        latex.log.info(message)
      }
    } else {
      latex.log.warning(`Rscript package ${packageName} was not found.`)
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

  constructArgs (jobState) {
    const args = [
      '-e "library(knitr)"',
      '-e "opts_knit$set(concordance = TRUE)"',
      `-e "knit('${escapePath(jobState.getKnitrFilePath())}')"`
    ]

    return args
  }

  constructPatchSynctexArgs (jobState) {
    let synctexPath = this.resolveOutputFilePath(jobState, '')

    const args = [
      '-e "library(patchSynctex)"',
      `-e "patchSynctex('${escapePath(jobState.getKnitrFilePath())}',syncfile='${escapePath(synctexPath)}')"`
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
