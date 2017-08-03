/** @babel */

import fs from 'fs-plus'
import path from 'path'
import LogParser from './parsers/log-parser'
import FdbParser from './parsers/fdb-parser'
import { heredoc, isPdfFile, isPsFile, isDviFile } from './werkzeug.js'

export default class Builder {
  envPathKey = this.getEnvironmentPathKey(process.platform)

  static canProcess (state) {}
  async run (jobState) {}
  constructArgs (jobState) {}
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

  parseLogFile (jobState) {
    const logFilePath = this.resolveLogFilePath(jobState)
    if (fs.existsSync(logFilePath)) {
      let filePath = jobState.getTexFilePath()
      // Use main source path if the generated LaTeX file is missing. This will
      // enable log parsing and finding the project root to continue without the
      // generated LaTeX file.
      if (!filePath) filePath = jobState.getFilePath()
      const parser = this.getLogParser(logFilePath, filePath)
      const result = parser.parse()
      if (result) {
        if (result.messages) {
          jobState.setLogMessages(result.messages)
        }
        if (result.outputFilePath) {
          jobState.setOutputFilePath(result.outputFilePath)
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
        '%SystemDrive%\\texlive\\2017\\bin\\win32',
        '%SystemDrive%\\texlive\\2016\\bin\\win32',
        '%SystemDrive%\\texlive\\2015\\bin\\win32',
        '%ProgramFiles%\\MiKTeX 2.9\\miktex\\bin\\x64',
        '%ProgramFiles(x86)%\\MiKTeX 2.9\\miktex\\bin'
      ].join(';')
    }

    return [
      '/usr/texbin',
      '/Library/TeX/texbin'
    ].join(':')
  }

  resolveOutputFilePath (jobState, ext) {
    let { dir, name } = path.parse(jobState.getFilePath())
    if (jobState.getJobName()) {
      name = jobState.getJobName()
    }
    dir = path.resolve(dir, jobState.getOutputDirectory())
    return path.format({ dir, name, ext })
  }

  resolveLogFilePath (jobState) {
    return this.resolveOutputFilePath(jobState, '.log')
  }

  getEnvironmentPathKey (platform) {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  resolveFdbFilePath (jobState) {
    return this.resolveOutputFilePath(jobState, '.fdb_latexmk')
  }

  parseFdbFile (jobState) {
    const fdbFilePath = this.resolveFdbFilePath(jobState)
    if (fs.existsSync(fdbFilePath)) {
      const parser = this.getFdbParser(fdbFilePath)
      const result = parser.parse()
      if (result) {
        jobState.setFileDatabase(result)
      }
    }
  }

  getFdbParser (fdbFilePath) {
    return new FdbParser(fdbFilePath)
  }

  parseLogAndFdbFiles (jobState) {
    this.parseLogFile(jobState)
    this.parseFdbFile(jobState)

    const fdb = jobState.getFileDatabase()
    if (fdb) {
      const sections = ['ps2pdf', 'xdvipdfmx', 'dvipdf', 'dvips', 'latex', 'pdflatex', 'lualatex', 'xelatex']
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
        jobState.setOutputFilePath(path.resolve(jobState.getProjectPath(), path.normalize(output)))
      }
    }
  }
}
