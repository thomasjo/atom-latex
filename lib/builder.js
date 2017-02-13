/* @flow */

import fs from 'fs-plus'
import path from 'path'
import LogParser from './parsers/log-parser'
import FdbParser from './parsers/fdb-parser'
// $FlowIgnore
import { heredoc, isPdfFile, isPsFile, isDviFile } from './werkzeug.js'
import { BuildState, JobState } from './build-state'

export default class Builder {
  executable: string
  envPathKey = this.getEnvironmentPathKey(process.platform)

  static canProcess (state: BuildState): boolean { return false }
  async run (jobState: JobState): Promise<number> { return 0 }
  constructArgs (jobState: JobState): Array<string> { return [] }
  async checkRuntimeDependencies (): Promise<void> {}

  logStatusCode (statusCode: number, stderr: string): void {
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
        const errorOutput: string = stderr ? ` and output of "${stderr}"` : ''
        latex.log.error(`TeXification failed with status code ${statusCode}${errorOutput}`)
    }
  }

  parseLogFile (jobState: JobState): void {
    const logFilePath: string = this.resolveLogFilePath(jobState)
    if (fs.existsSync(logFilePath)) {
      const parser: LogParser = this.getLogParser(logFilePath, jobState.getFilePath())
      const result: ?Object = parser.parse()
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

  getLogParser (logFilePath: string, texFilePath: string): LogParser {
    return new LogParser(logFilePath, texFilePath)
  }

  constructChildProcessOptions (directoryPath: string, defaultEnv: Object = {}): Object {
    const env: Object = Object.assign(defaultEnv, process.env)
    const childPath: string = this.constructPath()
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

  constructPath (): string {
    let texPath: string = (atom.config.get('latex.texPath') || '').trim()
    if (texPath.length === 0) {
      texPath = this.defaultTexPath(process.platform)
    }

    const processPath: ?string = process.env[this.envPathKey]
    const match: ?Array<string> = texPath.match(/^(.*)(\$PATH)(.*)$/)
    if (match && processPath) {
      return `${match[1]}${processPath}${match[3]}`
    }

    return [texPath, processPath]
      .filter((str: ?string): boolean => !!str && str.length > 0)
      .join(path.delimiter)
  }

  defaultTexPath (platform: string): string {
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

  resolveOutputFilePath (jobState: JobState, ext: string): string {
    let { dir, name }: { dir: string, name: string } = path.parse(jobState.getFilePath())
    if (jobState.getJobName()) {
      name = jobState.getJobName()
    }
    dir = path.resolve(dir, jobState.getOutputDirectory())
    return path.format({ dir, name, ext })
  }

  resolveLogFilePath (jobState: JobState): string {
    return this.resolveOutputFilePath(jobState, '.log')
  }

  getEnvironmentPathKey (platform: string): string {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  resolveFdbFilePath (jobState: JobState): string {
    return this.resolveOutputFilePath(jobState, '.fdb_latexmk')
  }

  parseFdbFile (jobState: JobState): void {
    const fdbFilePath: string = this.resolveFdbFilePath(jobState)
    if (fs.existsSync(fdbFilePath)) {
      const parser: FdbParser = this.getFdbParser(fdbFilePath)
      const result: ?Object = parser.parse()
      if (result) {
        jobState.setFileDatabase(result)
      }
    }
  }

  getFdbParser (fdbFilePath: string): FdbParser {
    return new FdbParser(fdbFilePath)
  }

  parseLogAndFdbFiles (jobState: JobState): void {
    this.parseLogFile(jobState)
    this.parseFdbFile(jobState)

    const fdb: ?Object = jobState.getFileDatabase()
    if (fdb) {
      const sections: Array<string> = ['ps2pdf', 'xdvipdfmx', 'dvipdf', 'dvips', 'latex', 'pdflatex', 'lualatex', 'xelatex']
      let output: string

      for (const section: string of sections) {
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
