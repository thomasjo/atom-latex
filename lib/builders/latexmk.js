/* @flow */

import path from 'path'
import Builder from '../builder'
import { BuildState, JobState } from '../build-state'
import type { ProcessResults } from '../types'

const LATEX_PATTERN: RegExp = /^latex|u?platex$/
const LATEXMK_VERSION_PATTERN: RegExp = /Version\s+(\S+)/i
const LATEXMK_MINIMUM_VERSION: string = '4.37'
const PDF_ENGINE_PATTERN: RegExp = /^(xelatex|lualatex)$/

export default class LatexmkBuilder extends Builder {
  executable = 'latexmk'

  static canProcess (state: BuildState): boolean {
    return !!state.getTexFilePath()
  }

  async run (jobState: JobState): Promise<number> {
    const args: Array<string> = this.constructArgs(jobState)

    const { statusCode, stderr }: ProcessResults = await this.execLatexmk(jobState.getProjectPath(), args, 'error')
    if (statusCode !== 0) {
      this.logStatusCode(statusCode, stderr)
    }

    return statusCode
  }

  async execLatexmk (directoryPath: string, args: Array<string>, type: string): Promise<ProcessResults> {
    const command: string = `${this.executable} ${args.join(' ')}`
    const options: Object = this.constructChildProcessOptions(directoryPath, { max_print_line: 1000 })

    return await latex.process.executeChildProcess(command, options)
  }

  async checkRuntimeDependencies (): Promise<void> {
    const { statusCode, stdout, stderr }: ProcessResults = await this.execLatexmk('.', ['-v'], 'error')

    if (statusCode !== 0) {
      latex.log.error(`latexmk check failed with code ${statusCode} and response of "${stderr}".`)
      return
    }

    const match: ?Array<string> = stdout.match(LATEXMK_VERSION_PATTERN)

    if (!match) {
      latex.log.warning(`latexmk check succeeded but with an unknown version response of "${stdout}".`)
      return
    }

    const version: string = match[1]

    if (version < LATEXMK_MINIMUM_VERSION) {
      latex.log.warning(`latexmk check succeeded but with a version of ${version}". Minimum version required is ${LATEXMK_MINIMUM_VERSION}.`)
      return
    }

    latex.log.info(`latexmk check succeeded. Found version ${version}.`)
  }

  logStatusCode (statusCode: number, stderr: string): void {
    switch (statusCode) {
      case 10:
        latex.log.error('latexmk: Bad command line arguments.')
        break
      case 11:
        latex.log.error('latexmk: File specified on command line not found or other file not found.')
        break
      case 12:
        latex.log.error('latexmk: Failure in some part of making files.')
        break
      case 13:
        latex.log.error('latexmk: error in initialization file.')
        break
      case 20:
        latex.log.error('latexmk: probable bug or retcode from called program.')
        break
      default:
        super.logStatusCode(statusCode, stderr)
    }
  }

  constructArgs (jobState: JobState): Array<string> {
    const args: Array<string> = [
      '-interaction=nonstopmode',
      '-f',
      '-cd',
      '-file-line-error'
    ]

    if (jobState.getShouldRebuild()) {
      args.push('-g')
    }
    if (jobState.getJobName()) {
      args.push(`-jobname="${jobState.getJobName()}"`)
    }
    if (jobState.getEnableShellEscape()) {
      args.push('-shell-escape')
    }
    if (jobState.getEnableSynctex()) {
      args.push('-synctex=1')
    }
    if (jobState.getEnableExtendedBuildMode()) {
      const latexmkrcPath: string = path.resolve(__dirname, '..', '..', 'resources', 'latexmkrc')
      args.push(`-r "${latexmkrcPath}"`)
    }

    if (jobState.getEngine().match(LATEX_PATTERN)) {
      args.push(`-latex="${jobState.getEngine()}"`)
      args.push(jobState.getOutputFormat() === 'pdf'
        ? this.constructPdfProducerArgs(jobState)
        : `-${jobState.getOutputFormat()}`)
    } else {
      // Look for other PDF engines that can be specified using short command
      // options, i.e. -lualatex and -xelatex
      if (jobState.getOutputFormat() === 'pdf' && jobState.getEngine().match(PDF_ENGINE_PATTERN)) {
        args.push(`-${jobState.getEngine()}`)
      } else {
        // Keep the option noise to a minimum by not passing default engine
        if (jobState.getEngine() !== 'pdflatex') {
          args.push(`-pdflatex="${jobState.getEngine()}"`)
        }
        args.push(`-${jobState.getOutputFormat()}`)
      }
    }

    if (jobState.getOutputDirectory()) {
      args.push(`-outdir="${jobState.getOutputDirectory()}"`)
    }

    args.push(`"${jobState.getTexFilePath()}"`)
    return args
  }

  constructPdfProducerArgs (jobState: JobState): string {
    const producer: string = jobState.getProducer()

    switch (producer) {
      case 'ps2pdf':
        return '-pdfps'
      case 'dvipdf':
        return '-pdfdvi -e "$dvipdf = \'dvipdf %O %S %D\';"'
      default:
        return `-pdfdvi -e "$dvipdf = '${producer} %O -o %D %S';"`
    }
  }
}
