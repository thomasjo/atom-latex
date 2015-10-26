'use babel'

import child_process from 'child_process'
import path from 'path'
import Builder from '../builder'

export default class TexifyBuilder extends Builder {
  constructor () {
    super()
    this.executable = 'texify'
  }

  run (filePath) {
    const args = this.constructArgs(filePath)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions()

    options.cwd = path.dirname(filePath) // Run process with sensible CWD.
    options.maxBuffer = 52428800 // Set process' max buffer size to 50 MB.

    return new Promise((resolve) => {
      // TODO: Add support for killing the process.
      child_process.exec(command, options, (error) => {
        resolve((error) ? error.code : 0)
      })
    })
  }

  constructArgs (filePath) {
    const args = [
      '--batch',
      '--pdf',
      '--tex-option="--synctex=1"',
      '--tex-option="--interaction=nonstopmode"',
      // Set logfile max line length.
      '--tex-option="--max-print-line=1000"'
    ]

    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const engineFromMagic = this.getLatexEngineFromMagic(filePath)
    const customEngine = atom.config.get('latex.customEngine')
    const engine = atom.config.get('latex.engine')

    if (enableShellEscape) {
      args.push('--tex-option=--enable-write18')
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
