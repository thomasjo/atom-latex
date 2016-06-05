'use babel'

import childProcess from 'child_process'
import path from 'path'
import Builder from '../builder'

export default class LatexmkBuilder extends Builder {
  constructor () {
    super()
    this.executable = 'latexmk'
  }

  static canProcess (filePath) {
    return path.extname(filePath) === '.tex'
  }

  run (filePath) {
    const args = this.constructArgs(filePath)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions()

    options.cwd = path.dirname(filePath) // Run process with sensible CWD.
    options.maxBuffer = 52428800 // Set process' max buffer size to 50 MB.
    options.env.max_print_line = 1000 // Max log file line length.

    return new Promise((resolve) => {
      // TODO: Add support for killing the process.
      childProcess.exec(command, options, (error) => {
        resolve((error) ? error.code : 0)
      })
    })
  }

  constructArgs (filePath) {
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
