'use babel'

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import LogParser from './parsers/log-parser'
import MagicParser from './parsers/magic-parser'

export default class Builder {
  envPathKey = this.getEnvironmentPathKey(process.platform)

  static canProcess (/* filePath */) {}
  run (/* filePath, jobname */) {}
  constructArgs (/* filePath, jobname */) {}

  parseLogFile (texFilePath, jobname) {
    const logFilePath = this.resolveLogFilePath(texFilePath, jobname)
    if (!fs.existsSync(logFilePath)) { return null }

    const parser = this.getLogParser(logFilePath)
    return parser.parse()
  }

  getLogParser (logFilePath) {
    return new LogParser(logFilePath)
  }

  constructChildProcessOptions (filePath) {
    const env = _.clone(process.env)
    const childPath = this.constructPath()
    if (childPath) {
      env[this.envPathKey] = childPath
    }

    return {
      encoding: 'utf8',
      maxBuffer: 52428800, // Set process' max buffer size to 50 MB.
      cwd: path.dirname(filePath), // Run process with sensible CWD.
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

  resolveLogFilePath (texFilePath, jobname) {
    const outputDirectory = atom.config.get('latex.outputDirectory') || ''
    const currentDirectory = path.dirname(texFilePath)
    const fileName = jobname ? `${jobname}.log` : path.basename(texFilePath).replace(/\.\w+$/, '.log')

    return path.join(currentDirectory, outputDirectory, fileName)
  }

  getEnvironmentPathKey (platform) {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  getOutputDirectory (filePath) {
    let outdir = atom.config.get('latex.outputDirectory')
    if (outdir) {
      const dir = path.dirname(filePath)
      outdir = path.join(dir, outdir)
    }

    return outdir
  }

  getLatexEngineFromMagic (filePath) {
    const magic = new MagicParser(filePath).parse()
    if (magic && magic.program) {
      return magic.program
    }

    return null
  }

  getJobNamesFromMagic (filePath) {
    const magic = new MagicParser(filePath).parse()
    if (magic && magic.jobnames) {
      return magic.jobnames.split(/\s+/)
    }

    return [null]
  }

}
