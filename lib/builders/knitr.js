/* @flow */

import path from 'path'
import Builder from '../builder'
import { BuildState, JobState } from '../build-state'
import type { ProcessResults } from '../types'

const MISSING_PACKAGE_PATTERN: RegExp = /there is no package called [‘']([^’']+)[’']/g
const OUTPUT_PATH_PATTERN: RegExp = /\[\d+]\s+"(.*)"/
const RSCRIPT_VERSION_PATTERN: RegExp = /version\s+(\S+)/i
const PACKAGE_VERSION_PATTERN: RegExp = /^\[1] "([^"]*)"/

function escapePath (filePath: string): string {
  return filePath.replace(/\\/g, '\\\\')
}

export default class KnitrBuilder extends Builder {
  executable: string = 'Rscript'

  static canProcess (state: BuildState): boolean {
    return !state.getTexFilePath() && !!state.getKnitrFilePath()
  }

  async run (jobState: JobState): Promise<number> {
    const args: Array<string> = this.constructArgs(jobState)
    const { statusCode, stdout, stderr }: ProcessResults = await this.execRscript(jobState.getProjectPath(), args, 'error')
    if (statusCode !== 0) {
      this.logStatusCode(statusCode, stderr)
      return statusCode
    }

    jobState.setTexFilePath(this.resolveOutputPath(jobState.getKnitrFilePath(), stdout))

    const builder: Builder = latex.builderRegistry.getBuilder(jobState)
    const code: number = await builder.run(jobState)

    if (code === 0 && jobState.getEnableSynctex()) {
      const args: Array<string> = this.constructPatchSynctexArgs(jobState)
      await this.execRscript(jobState.getProjectPath(), args, 'warning')
    }

    return code
  }

  async checkRuntimeDependencies (): Promise<void> {
    const { statusCode, stderr }: ProcessResults = await this.execRscript('.', ['--version'], 'warning')

    if (statusCode !== 0) {
      latex.log.warning(`Rscript check failed with code ${statusCode} and response of "${stderr}".`)
      return
    }

    const match: ?Array<string> = stderr.match(RSCRIPT_VERSION_PATTERN)

    if (!match) {
      latex.log.warning(`Rscript check succeeded but with an unknown version response of "${stderr}".`)
      return
    }

    const version: string = match[1]

    latex.log.info(`Rscript check succeeded. Found version ${version}.`)

    await this.checkRscriptPackageVersion('knitr')
    await this.checkRscriptPackageVersion('patchSynctex', '0.1-4')
  }

  async checkRscriptPackageVersion (packageName: string, minimumVersion: ?string): Promise<void> {
    const result: ProcessResults = await this.execRscript('.', [`-e "installed.packages()['${packageName}','Version']"`], 'warning')

    if (result.statusCode === 0) {
      const match: ?Array<string> = result.stdout.match(PACKAGE_VERSION_PATTERN)
      if (match) {
        const version: string = match[1]
        const message: string = `Rscript ${packageName} package check succeeded. Found version ${version}.`
        if (minimumVersion && minimumVersion > version) {
          latex.log.warning(`${message} Minimum version ${minimumVersion} needed.`)
        } else {
          latex.log.info(message)
        }
        return
      }
    }

    latex.log.warning(`Rscript package ${packageName} was not found.`)
  }

  async execRscript (directoryPath: string, args: Array<string>, type: string): Promise<ProcessResults> {
    const command: string = `${this.executable} ${args.join(' ')}`
    const options: Object = this.constructChildProcessOptions(directoryPath)

    let results: ProcessResults = await latex.process.executeChildProcess(command, options)

    if (results.statusCode !== 0) {
      // Parse error message to detect missing libraries.
      let match
      while ((match = MISSING_PACKAGE_PATTERN.exec(results.stderr)) !== null) {
        const text: string = `The R package "${match[1]}" could not be loaded.`
        latex.log.showMessage({ type, text })
        results.statusCode = -1
      }
    }

    return results
  }

  constructArgs (jobState: JobState): Array<string> {
    const args: Array<string> = [
      '-e "library(knitr)"',
      '-e "opts_knit$set(concordance = TRUE)"',
      `-e "knit('${escapePath(jobState.getKnitrFilePath())}')"`
    ]

    return args
  }

  constructPatchSynctexArgs (jobState: JobState): Array<string> {
    let synctexPath: string = this.resolveOutputFilePath(jobState, '')

    const args: Array<string> = [
      '-e "library(patchSynctex)"',
      `-e "patchSynctex('${escapePath(jobState.getKnitrFilePath())}',syncfile='${escapePath(synctexPath)}')"`
    ]

    return args
  }

  resolveOutputPath (sourcePath: string, stdout: string): string {
    const candidatePath:string = OUTPUT_PATH_PATTERN.exec(stdout)[1]
    if (path.isAbsolute(candidatePath)) {
      return candidatePath
    }

    const sourceDir: string = path.dirname(sourcePath)
    return path.join(sourceDir, candidatePath)
  }
}
