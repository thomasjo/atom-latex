/** @babel */

import path from 'path'
import Builder from '../builder'

const LATEX_PATTERN = /^latex|u?platex$/

export default class LatexmkBuilder extends Builder {
  executable = 'latexmk'

  static canProcess (filePath) {
    return path.extname(filePath) === '.tex'
  }

  async run (filePath, jobname, shouldRebuild) {
    const args = this.constructArgs(filePath, jobname, shouldRebuild)
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

  constructArgs (filePath, jobname, shouldRebuild) {
    const args = [
      '-interaction=nonstopmode',
      '-f',
      '-cd',
      '-file-line-error'
    ]

    const outputFormat = this.getOutputFormat(filePath)
    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const enableLatexmkrc = atom.config.get('latex.enableLatexmkrc')
    const engine = this.getLatexEngine(filePath)

    if (shouldRebuild) {
      args.push('-g')
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
    if (enableLatexmkrc) {
      const latexmkrcPath = path.resolve(__dirname, '../../resources/latexmkrc')
      args.push(`-r "${latexmkrcPath}"`)
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

  constructPdfProducerArgs (filePath) {
    const producer = this.getProducer(filePath)

    switch (producer) {
      case 'ps2pdf':
        return '-pdfps'
      case 'dvipdf':
        return '-pdfdvi -e "$dvipdf = \'dvipdf %O %S %D\';"'
      default:
        return `-pdfdvi -e "$dvipdf = \'${producer} %O -o %D %S\';"`
    }
  }
}
