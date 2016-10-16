/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'
import LogParser from './parsers/log-parser'
import MagicParser from './parsers/magic-parser'
import FdbParser from './parsers/fdb-parser'
import { heredoc } from './werkzeug.js'

const OUTPUT_EXTENSION_PATTERNS = [/^\.pdf$/i, /^\.ps$/i, /^\.(?:dvi|xdv)$/i]

export default class Builder {
  envPathKey = this.getEnvironmentPathKey(process.platform)

  static canProcess (/* filePath */) {}
  async run (/* filePath, jobname, shouldRebuild */) {}
  constructArgs (/* filePath, jobname, shouldRebuild */) {}

  logStatusCode (statusCode) {
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
        latex.log.error(`TeXification failed with status code ${statusCode}`)
    }
  }

  parseLogFile (texFilePath, jobname) {
    const logFilePath = this.resolveLogFilePath(texFilePath, jobname)
    if (!fs.existsSync(logFilePath)) { return null }

    const parser = this.getLogParser(logFilePath, texFilePath)
    return parser.parse()
  }

  getLogParser (logFilePath, texFilePath) {
    return new LogParser(logFilePath, texFilePath)
  }

  constructChildProcessOptions (filePath, defaultEnv) {
    const env = _.assign(defaultEnv || {}, process.env)
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

  resolveOutputFilePath (texFilePath, jobname, extension) {
    const outputDirectory = this.getOutputDirectory(texFilePath)

    const currentDirectory = path.dirname(texFilePath)
    const fileName = jobname ? jobname + extension : path.basename(texFilePath).replace(/\.\w+$/, extension)

    return path.join(currentDirectory, outputDirectory, fileName)
  }

  resolveLogFilePath (texFilePath, jobname) {
    return this.resolveOutputFilePath(texFilePath, jobname, '.log')
  }

  getEnvironmentPathKey (platform) {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  getOutputDirectory (filePath) {
    const outputDirectory = this.getOutputDirectoryFromMagic(filePath)
    if (outputDirectory) return outputDirectory

    return atom.config.get('latex.outputDirectory')
  }

  getOutputDirectoryFromMagic (filePath) {
    const magic = new MagicParser(filePath).parse()
    if (magic && magic.output_directory) {
      return magic.output_directory
    }

    return null
  }

  getOutputFormat (filePath) {
    const outputFormat = this.getOutputFormatFromMagic(filePath)
    if (outputFormat) return outputFormat

    return atom.config.get('latex.outputFormat')
  }

  getOutputFormatFromMagic (filePath) {
    const magic = new MagicParser(filePath).parse()
    if (magic && magic.format) {
      return magic.format
    }

    return null
  }

  getLatexEngine (filePath) {
    const engine = this.getLatexEngineFromMagic(filePath)
    if (engine) return engine

    const customEngine = atom.config.get('latex.customEngine')
    if (customEngine) return customEngine

    return atom.config.get('latex.engine')
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
    // Sublime compatability
    if (magic && magic.jobname) {
      return [magic.jobname]
    }

    return [null]
  }

  getProducer (filePath) {
    const producer = this.getProducerFromMagic(filePath)
    if (producer) return producer

    return atom.config.get('latex.producer')
  }

  getProducerFromMagic (filePath) {
    const magic = new MagicParser(filePath).parse()
    if (magic && magic.producer) {
      return magic.producer
    }

    return null
  }

  resolveFdbFilePath (texFilePath, jobname) {
    return this.resolveOutputFilePath(texFilePath, jobname, '.fdb_latexmk')
  }

  parseFdbFile (texFilePath, jobname) {
    const fdbFilePath = this.resolveFdbFilePath(texFilePath, jobname)
    if (!fs.existsSync(fdbFilePath)) { return null }

    const parser = this.getFdbParser(fdbFilePath)
    return parser.parse()
  }

  getFdbParser (fdbFilePath) {
    return new FdbParser(fdbFilePath)
  }

  parseLogAndFdbFiles (texFilePath, jobname) {
    const result = this.parseLogFile(texFilePath, jobname)

    if (result) {
      result.fdb = this.parseFdbFile(texFilePath, jobname)
      if (result.fdb) {
        const allOutputs = result.fdb.ps2pdf || result.fdb.dvipdf ||
          result.fdb.dvips || result.fdb.latex || result.fdb.pdflatex

        for (const pattern of OUTPUT_EXTENSION_PATTERNS) {
          const outputs = _.filter(allOutputs, output => path.extname(output).match(pattern))
          if (!outputs.length) continue

          let output = _.find(outputs, output => path.isAbsolute(output))
          if (output) {
            result.outputFilePath = path.normalize(output)
          } else {
            const rootPath = path.dirname(texFilePath)
            result.outputFilePath = path.resolve(rootPath, path.normalize(outputs[0]))
          }

          break
        }
      }
    }

    return result
  }
}
