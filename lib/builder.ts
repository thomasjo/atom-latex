import fs from 'fs'
import path from 'path'
import LogParser from './parsers/log-parser'
import FdbParser from './parsers/fdb-parser'
import BuildState from './build-state'
import JobState from './job-state'
import { heredoc, isPdfFile, isPsFile, isDviFile } from './werkzeug'

export default abstract class Builder {
  executable?: string
  envPathKey = this.getEnvironmentPathKey(process.platform)

  // TODO: Find a better way of solving the lack of support for static members on interfaces.
  static canProcess (state: BuildState) {
    throw new Error('Implementing class must override static function `canProcess`.')
  }

  abstract async run (jobState: JobState): Promise<number>
  abstract constructArgs (jobState: JobState): string[]
  abstract async checkRuntimeDependencies (): Promise<void>

  logStatusCode (statusCode: number, stderr?: string) {
    switch (statusCode) {
      case 127:
        latex.log.error(heredoc(`
          TeXification failed! Builder executable '${this.executable}' not found.
            latex.texPath
              as configured: ${atom.config.get('latex.texPath')}
              when resolved: ${this.constructPath()}
          Make sure latex.texPath is configured correctly either adjust it \
          via the settings view, or directly in your config.cson file.
          `)!)
        break
      case 0:
        break
      default:
        const errorOutput = stderr ? ` and output of "${stderr}"` : ''
        latex.log.error(`TeXification failed with status code ${statusCode}${errorOutput}`)
    }
  }

  parseLogFile (jobState: JobState) {
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

  getLogParser (logFilePath: string, texFilePath: string) {
    return new LogParser(logFilePath, texFilePath)
  }

  constructChildProcessOptions (directoryPath: string, defaultEnv?: any) {
    const env = Object.assign(defaultEnv || {}, process.env)
    const childPath = this.constructPath()
    if (childPath) {
      env[this.envPathKey] = childPath
    }

    return {
      allowKill: true,
      encoding: 'utf8',
      maxBuffer: 52428800, // Set process' max buffer size to 50 MB.
      cwd: directoryPath, // Run process with sensible CWD.
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

  defaultTexPath (platform: string) {
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

  resolveOutputFilePath (jobState: JobState, ext: string) {
    let { dir, name } = path.parse(jobState.getFilePath())
    if (jobState.getJobName()) {
      name = jobState.getJobName()
    }
    dir = path.resolve(dir, jobState.getOutputDirectory()!)
    return path.format({ dir, name, ext })
  }

  resolveLogFilePath (jobState: JobState) {
    return this.resolveOutputFilePath(jobState, '.log')
  }

  getEnvironmentPathKey (platform: string) {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  resolveFdbFilePath (jobState: JobState) {
    return this.resolveOutputFilePath(jobState, '.fdb_latexmk')
  }

  parseFdbFile (jobState: JobState) {
    const fdbFilePath = this.resolveFdbFilePath(jobState)
    if (fs.existsSync(fdbFilePath)) {
      const parser = this.getFdbParser(fdbFilePath)
      const result = parser.parse()
      if (result) {
        jobState.setFileDatabase(result)
      }
    }
  }

  getFdbParser (fdbFilePath: string) {
    return new FdbParser(fdbFilePath)
  }

  parseLogAndFdbFiles (jobState: JobState) {
    this.parseLogFile(jobState)
    this.parseFdbFile(jobState)

    const fdb = jobState.getFileDatabase()
    if (fdb) {
      const sections = ['ps2pdf', 'xdvipdfmx', 'dvipdf', 'dvips', 'latex', 'pdflatex', 'lualatex', 'xelatex']
      let output

      for (const section of sections) {
        if (fdb[section] && fdb[section].generated) {
          const generated = fdb[section].generated

          output = generated.find((output: string) => isPdfFile(output))
          if (output) break

          output = generated.find((output: string) => isPsFile(output))
          if (output) break

          output = generated.find((output: string) => isDviFile(output))
          if (output) break
        }
      }

      if (output) {
        jobState.setOutputFilePath(path.resolve(jobState.getProjectPath()!, path.normalize(output)))
      }
    }
  }
}
