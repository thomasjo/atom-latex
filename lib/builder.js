'use babel'

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import LogParser from './parsers/log-parser'
import MagicParser from './parsers/magic-parser'

let builders = []

function getAllBuilders () {
  if (builders.length === 0) {
    const moduleDir = path.join(__dirname, 'builders')
    const entries = fs.readdirSync(moduleDir)
    builders = entries.map((entry) => require(path.join(moduleDir, entry)))
  }

  return builders
}

function resolveAmbigiousBuilders (builders) {
  const names = builders.map((builder) => builder.name)
  const indexOfLatexmk = names.indexOf('LatexmkBuilder')
  const indexOfTexify = names.indexOf('TexifyBuilder')
  if (builders.length === 2 && indexOfLatexmk >= 0 && indexOfTexify >= 0) {
    switch (atom.config.get('latex.builder')) {
      case 'latexmk': return builders[indexOfLatexmk]
      case 'texify': return builders[indexOfTexify]
    }
  }

  throw Error('Unable to resolve ambigous builder registration')
}

export default class Builder {
  constructor () {
    this.envPathKey = this.getEnvironmentPathKey(process.platform)
  }

  static canProcess (/* filePath */) {}
  run (/* filePath */) {}
  constructArgs (/* filePath */) {}

  static getBuilder (filePath) {
    const builders = getAllBuilders()
    const candidates = builders.filter((builder) => builder.canProcess(filePath))
    switch (candidates.length) {
      case 0: return null
      case 1: return candidates[0]
    }

    return resolveAmbigiousBuilders(candidates)
  }

  parseLogFile (texFilePath) {
    const logFilePath = this.resolveLogFilePath(texFilePath)
    if (!fs.existsSync(logFilePath)) { return null }

    const parser = this.getLogParser(logFilePath)
    return parser.parse()
  }

  getLogParser (logFilePath) {
    return new LogParser(logFilePath)
  }

  constructChildProcessOptions () {
    const env = _.clone(process.env)
    const childPath = this.constructPath()
    if (childPath) {
      env[this.envPathKey] = childPath
    }

    return {env}
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

  resolveLogFilePath (texFilePath) {
    const outputDirectory = atom.config.get('latex.outputDirectory') || ''
    const currentDirectory = path.dirname(texFilePath)
    const fileName = path.basename(texFilePath).replace(/\.\w+$/, '.log')

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
}
