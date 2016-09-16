/** @babel */

import childProcess from 'child_process'
import path from 'path'
import Builder from '../builder'

const latexRegExp = /^latex|u?platex$/

export default class LatexmkBuilder extends Builder {
  executable = 'latexmk'

  static canProcess (filePath) {
    return path.extname(filePath) === '.tex'
  }

  run (filePath, jobname) {
    const args = this.constructArgs(filePath, jobname)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(filePath)

    options.env.max_print_line = 1000 // Max log file line length.

    return new Promise((resolve) => {
      // TODO: Add support for killing the process.
      childProcess.exec(command, options, (error) => {
        resolve((error) ? error.code : 0)
      })
    })
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

  constructArgs (filePath, jobname) {
    const args = [
      '-interaction=nonstopmode',
      '-f',
      '-cd',
      '-file-line-error'
    ]

    const outputFormat = this.getOutputFormatFromMagic(filePath) ||
      atom.config.get('latex.outputFormat') || 'pdf'
    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const engine = this.getLatexEngineFromMagic(filePath) ||
      atom.config.get('latex.customEngine') ||
      atom.config.get('latex.engine') || 'pdflatex'
    const producer = this.getProducerFromMagic(filePath) ||
      atom.config.get('latex.producer') || 'dvipdf'

    if (jobname) {
      args.push(`-jobname=${jobname}`)
    }
    if (enableShellEscape) {
      args.push('-shell-escape')
    }
    if (enableSynctex) {
      args.push('-synctex=1')
    }

    if (engine.match(latexRegExp)) {
      args.push(`-latex="${engine}"`)
      if (outputFormat === 'pdf') {
        switch (producer) {
          case 'default':
            // default is an option to protect a user's .latexmkrc from override
            args.push('-pdfdvi')
            break
          case 'dvipdf':
            args.push('-pdfdvi')
            args.push('-e "\\$dvipdf = \'dvipdf %O %S %D\';"')
            break
          case 'dvipdfm':
            args.push('-pdfdvi')
            args.push('-e "\\$dvipdf = \'dvipdfm %O -o %D %S\';"')
            break
          case 'dvipdfmx':
            args.push('-pdfdvi')
            args.push('-e "\\$dvipdf = \'dvipdfmx %O -o %D %S\';"')
            break
          case 'ps2pdf':
            args.push(`-ps2pdf`)
            break
          default:
            atom.notifications.addWarning(`Unknown PDF producer ${producer}, using fallback dvipdf.`)
            args.push('-pdfdvi')
            break
        }
      } else {
        args.push(`-${outputFormat}`)
      }
    } else {
      if (engine !== 'pdflatex') {
        args.push(`-pdflatex="${engine}"`)
      }
      args.push(`-${outputFormat}`)
    }

    let outdir = this.getOutputDirectory(filePath)
    if (outdir) {
      args.push(`-outdir="${outdir}"`)
    }

    args.push(`"${filePath}"`)
    return args
  }
}
