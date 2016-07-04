'use babel'

import childProcess from 'child_process'
import path from 'path'
import Builder from '../builder'

export default class TexifyBuilder extends Builder {
  executable = 'texify'

  static canProcess (filePath) {
    return path.extname(filePath) === '.tex'
  }

  run (filePath, jobname) {
    const args = this.constructArgs(filePath, jobname)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(filePath)

    return new Promise((resolve) => {
      // TODO: Add support for killing the process.
      childProcess.exec(command, options, (error) => {
        resolve((error) ? error.code : 0)
      })
    })
  }

  constructArgs (filePath, jobname) {
    const args = [
      '--batch',
      '--pdf',
      '--tex-option="--interaction=nonstopmode"',
      // Set logfile max line length.
      '--tex-option="--max-print-line=1000"'
    ]

    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const engineFromMagic = this.getLatexEngineFromMagic(filePath)
    const customEngine = atom.config.get('latex.customEngine')
    const engine = atom.config.get('latex.engine')

    if (jobname) {
      args.push(`--tex-option="--job-name=${jobname}"`)
    }
    if (enableShellEscape) {
      args.push('--tex-option=--enable-write18')
    }
    if (enableSynctex) {
      args.push('--tex-option="--synctex=1"')
    }

    if (engineFromMagic) {
      args.push(`--engine="${engineFromMagic}"`)
    } else if (customEngine) {
      args.push(`--engine="${customEngine}"`)
    } else if (engine && engine === 'xelatex') {
      args.push('--engine=xetex')
    } else if (engine && engine === 'lualatex') {
      args.push('--engine=luatex')
    }

    let outdir = this.getOutputDirectory(filePath)
    if (outdir) {
      atom.notifications.addWarning(
        'Output directory functionality is poorly supported by texify, ' +
        'so this functionality is disabled (for the foreseeable future) ' +
        'when using the texify builder.'
      )
    }

    args.push(`"${filePath}"`)
    return args
  }
}
