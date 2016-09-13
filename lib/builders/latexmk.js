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

    const outputFormat = atom.config.get('latex.outputFormat') || 'pdf'
    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const engine = this.getLatexEngineFromMagic(filePath) ||
      atom.config.get('latex.customEngine') ||
      atom.config.get('latex.engine') || 'pdflatex'

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
      if (outputFormat !== 'dvi') {
        atom.notifications.addWarning(
          'PS/PDF output is not supported by LaTeX engines.'
        )
      }
      args.push('-dvi')
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
