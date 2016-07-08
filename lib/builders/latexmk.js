'use babel'

import childProcess from 'child_process'
import path from 'path'
import Builder from '../builder'

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

  constructArgs (filePath, jobname) {
    const outputFormat = atom.config.get('latex.outputFormat') || 'pdf'

    const args = [
      '-interaction=nonstopmode',
      '-f',
      '-cd',
      `-${outputFormat}`,
      '-file-line-error'
    ]

    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const engineFromMagic = this.getLatexEngineFromMagic(filePath)
    const customEngine = atom.config.get('latex.customEngine')
    const engine = atom.config.get('latex.engine')

    if (jobname) {
      args.push(`-jobname=${jobname}`)
    }
    if (enableShellEscape) {
      args.push('-shell-escape')
    }
    if (enableSynctex) {
      args.push('-synctex=1')
    }

    if (engineFromMagic) {
      args.push(`-pdflatex="${engineFromMagic}"`)
    } else if (customEngine) {
      args.push(`-pdflatex="${customEngine}"`)
    } else if (engine && engine !== 'pdflatex') {
      args.push(`-${engine}`)
    }

    let outdir = this.getOutputDirectory(filePath)
    if (outdir) {
      args.push(`-outdir="${outdir}"`)
    }

    args.push(`"${filePath}"`)
    return args
  }
}
