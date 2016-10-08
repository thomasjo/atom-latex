/** @babel */

import path from 'path'
import Builder from '../builder'
import { BUILD_ACTION, REBUILD_ACTION, CLEAN_ACTION, FULL_CLEAN_ACTION } from '../actions'

const LATEX_PATTERN = /^latex|u?platex$/

export default class LatexmkBuilder extends Builder {
  executable = 'latexmk'

  static canProcess (filePath) {
    return path.extname(filePath) === '.tex'
  }

  async run (filePath, action = BUILD_ACTION, jobname = null) {
    const args = this.constructArgs(filePath, action, jobname)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(filePath, { max_print_line: 1000 })

    const { statusCode } = await latex.process.executeChildProcess(command, options)
    return statusCode
  }

  logStatusCode (statusCode) {
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
        super.logStatusCode(statusCode)
    }
  }

  constructArgs (filePath, action = BUILD_ACTION, jobname = null) {
    const args = [
      '-interaction=nonstopmode',
      '-f',
      '-cd',
      '-file-line-error'
    ]

    const outputFormat = this.getOutputFormat(filePath)
    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const engine = this.getLatexEngine(filePath)

    switch (action) {
      case REBUILD_ACTION:
        args.push('-g')
        break
      case CLEAN_ACTION:
        args.push(this.constructCleanArgs('-c'))
        break
      case FULL_CLEAN_ACTION:
        args.push(this.constructCleanArgs('-C'))
        break
    }

    if (jobname) {
      args.push(`-jobname=${jobname}`)
    }
    if (enableShellEscape) {
      args.push('-shell-escape')
    }
    if (enableSynctex) {
      args.push('-synctex=1')
    }

    if (engine.match(LATEX_PATTERN)) {
      args.push(`-latex="${engine}"`)
      args.push(outputFormat === 'pdf'
        ? this.constructPdfProducerArgs(filePath)
        : `-${outputFormat}`)
    } else {
      args.push(`-pdflatex="${engine}"`)
      args.push(`-${outputFormat}`)
    }

    let outdir = this.getOutputDirectory(filePath)
    if (outdir) {
      args.push(`-outdir="${outdir}"`)
    }

    args.push(`"${filePath}"`)
    return args
  }

  constructCleanArgs (option) {
    const cleanExtensions = atom.config.get('latex.cleanExtensions')
    if (!cleanExtensions.length) return option

    return `${option} -e "\\$clean_ext='${cleanExtensions.join(' ')}'"`
  }

  constructPdfProducerArgs (filePath) {
    const producer = this.getProducer(filePath)

    switch (producer) {
      case 'ps2pdf':
        return '-pdfps'
      case 'dvipdf':
        return '-pdfdvi -e "\\$dvipdf=\'dvipdf %O %S %D\';"'
      default:
        return `-pdfdvi -e "\\$dvipdf=\'${producer} %O -o %D %S\';"`
    }
  }
}
