/** @babel */

import fs from 'fs-plus'
import path from 'path'
import LogParser from './parsers/log-parser'
import FdbParser from './parsers/fdb-parser'
import { heredoc, isPdfFile, isPsFile, isDviFile } from './werkzeug.js'

export default class Builder {
  envPathKey = this.getEnvironmentPathKey(process.platform)

  static canProcess (filePath) {}
  async run (state) {}
  constructArgs (state) {}
  async checkRuntimeDependencies () {}

  logStatusCode (statusCode, stderr) {
    switch (statusCode) {
      case 127:
        latex.log.error(heredoc(`
          TeXification failed! Builder executable '${this.executable}' not found.
            latex.texPath
              as configured: ${atom.config.get('latex.texPath')}
              when resolved: ${this.constructPath()}
          Make sure latex.texPath is configured correctly either adjust it \
          via the settings view, or directly in your config.cson file.
          `))
        break
      case 0:
        break
      default:
        const errorOutput = stderr ? ` and output of "${stderr}"` : ''
        latex.log.error(`TeXification failed with status code ${statusCode}${errorOutput}`)
    }
  }

  parseLogFile (state) {
    const logFilePath = this.resolveLogFilePath(state)
    if (fs.existsSync(logFilePath)) {
      const parser = this.getLogParser(logFilePath, state.getFilePath())
      const result = parser.parse()
      if (result) {
        if (result.messages) {
          state.setLogMessages(result.messages)
        }
        if (result.outputFilePath) {
          state.setOutputFilePath(result.outputFilePath)
        }
      }
    }
  }

  getLogParser (logFilePath, texFilePath) {
    return new LogParser(logFilePath, texFilePath)
  }

  constructChildProcessOptions (directoryPath, defaultEnv) {
    const env = Object.assign(defaultEnv || {}, process.env)
    const childPath = this.constructPath()
    if (childPath) {
      env[this.envPathKey] = childPath
    }

    return {
      allowKill: true,
      encoding: 'utf8',
      maxBuffer: 52428800, // Set process' max buffer size to 50 MB.
      cwd: directoryPath,  // Run process with sensible CWD.
      env
    }
  }

  constructPath () {
    let texPath = (atom.config.get('latex.texPath') || '').trim()
    if (texPath.length === 0) {
      texPath = this.defaultTexPath(process.platform)
    }

    const processPath = process.env[this.envPathKey]
    const match = texPath.match(/^(.*)(\$PATH)(.*)$/)
    if (match) {
      return `${match[1]}${processPath}${match[3]}`
    }

    return [texPath, processPath]
      .filter(str => str && str.length > 0)
      .join(path.delimiter)
  }

  defaultTexPath (platform) {
    if (platform === 'win32') {
      return [
        '%SystemDrive%\\texlive\\2016\\bin\\win32',
        '%SystemDrive%\\texlive\\2015\\bin\\win32',
        '%SystemDrive%\\texlive\\2014\\bin\\win32',
        '%ProgramFiles%\\MiKTeX 2.9\\miktex\\bin\\x64',
        '%ProgramFiles(x86)%\\MiKTeX 2.9\\miktex\\bin'
      ].join(';')
    }

    return [
      '/usr/texbin',
      '/Library/TeX/texbin'
    ].join(':')
  }

  resolveOutputFilePath (state, ext) {
    let { dir, name } = path.parse(state.getFilePath())
    if (state.getJobname()) {
      name = state.getJobname()
    }
    dir = path.resolve(dir, state.getOutputDirectory())
    return path.format({ dir, name, ext })
  }

  resolveLogFilePath (state) {
    return this.resolveOutputFilePath(state, '.log')
  }

  getEnvironmentPathKey (platform) {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  resolveFdbFilePath (state) {
    return this.resolveOutputFilePath(state, '.fdb_latexmk')
  }

  parseFdbFile (state) {
    const fdbFilePath = this.resolveFdbFilePath(state)
    if (fs.existsSync(fdbFilePath)) {
      const parser = this.getFdbParser(fdbFilePath)
      const result = parser.parse()
      if (result) {
        state.setFileDatabase(result)
      }
    }
  }

  getFdbParser (fdbFilePath) {
    return new FdbParser(fdbFilePath)
  }

  parseLogAndFdbFiles (state) {
    this.parseLogFile(state)
    this.parseFdbFile(state)

    const fdb = state.getFileDatabase()
    if (fdb) {
      const sections = ['ps2pdf', 'dvipdf', 'dvips', 'latex', 'pdflatex']
      let output

      for (const section of sections) {
        if (fdb[section] && fdb[section].generated) {
          const generated = fdb[section].generated

          output = generated.find(output => isPdfFile(output))
          if (output) break

          output = generated.find(output => isPsFile(output))
          if (output) break

          output = generated.find(output => isDviFile(output))
          if (output) break
        }
      }

      if (output) {
        state.setOutputFilePath(path.resolve(state.getProjectPath(), path.normalize(output)))
      }
    }
  }
}
