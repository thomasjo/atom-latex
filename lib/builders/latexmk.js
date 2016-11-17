/** @babel */

import path from 'path'
import Builder from '../builder'

const LATEX_PATTERN = /^latex|u?platex$/
const LATEXMK_VERSION_PATTERN = /Version\s+(\S+)/i
const LATEXMK_MINIMUM_VERSION = '4.37'
const PDF_ENGINE_PATTERN = /^(xelatex|lualatex)$/

export default class LatexmkBuilder extends Builder {
  executable = 'latexmk'

  static canProcess (filePath) {
    return path.extname(filePath) === '.tex'
  }

  async run (filePath, jobname, shouldRebuild) {
    const args = this.constructArgs(filePath, jobname, shouldRebuild)
    const directoryPath = path.dirname(filePath)

    const { statusCode, stderr } = await this.execLatexmk(directoryPath, args, 'error')
    if (statusCode !== 0) {
      this.logStatusCode(statusCode, stderr)
    }

    return statusCode
  }

  async execLatexmk (directoryPath, args, type) {
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(directoryPath, { max_print_line: 1000 })

    return await latex.process.executeChildProcess(command, options)
  }

  async checkRuntimeDependencies () {
    const { statusCode, stdout, stderr } = await this.execLatexmk('.', ['-v'], 'error')

    if (statusCode !== 0) {
      latex.log.error(`latexmk check failed with code ${statusCode} and response of "${stderr}".`)
      return
    }

    const match = stdout.match(LATEXMK_VERSION_PATTERN)

    if (!match) {
      latex.log.warning(`latexmk check succeeded but with an unknown version response of "${stdout}".`)
      return
    }

    const version = match[1]

    if (version < LATEXMK_MINIMUM_VERSION) {
      latex.log.warning(`latexmk check succeeded but with a version of ${version}". Minimum version required is ${LATEXMK_MINIMUM_VERSION}.`)
      return
    }

    latex.log.info(`latexmk check succeeded. Found version ${version}.`)
  }

  logStatusCode (statusCode, stderr) {
    switch (statusCode) {
      case 10:
        latex.log.error('latexmk: Bad command line arguments.')
        break
      case 11:
        latex.log.error('latexmk: File specified on command line not found or other file not found.')
        break
      case 12:
        latex.log.error('latexmk: Failure in some part of making files.')
        break
      case 13:
        latex.log.error('latexmk: error in initialization file.')
        break
      case 20:
        latex.log.error('latexmk: probable bug or retcode from called program.')
        break
      default:
        super.logStatusCode(statusCode, stderr)
    }
  }

  constructArgs (filePath, jobname, shouldRebuild) {
    const args = [
      '-interaction=nonstopmode',
      '-f',
      '-cd',
      '-file-line-error'
    ]

    const outputFormat = this.getOutputFormat(filePath)
    const enableShellEscape = atom.config.get('latex.enableShellEscape')
    const enableSynctex = atom.config.get('latex.enableSynctex') !== false
    const enableExtendedBuildMode = atom.config.get('latex.enableExtendedBuildMode')
    const engine = this.getLatexEngine(filePath)

    if (shouldRebuild) {
      args.push('-g')
    }
    if (jobname) {
      args.push(`-jobname=${jobname}`)
    }
    if (enableShellEscape) {
      args.push('-shell-escape')
    }
    if (enableSynctex) {
      args.push('-synctex=1')
    }
    if (enableExtendedBuildMode) {
      const latexmkrcPath = path.resolve(__dirname, '..', '..', 'resources', 'latexmkrc')
      args.push(`-r "${latexmkrcPath}"`)
    }

    if (engine.match(LATEX_PATTERN)) {
      args.push(`-latex="${engine}"`)
      args.push(outputFormat === 'pdf'
        ? this.constructPdfProducerArgs(filePath)
        : `-${outputFormat}`)
    } else {
      // Look for other PDF engines that can be specified using short command
      // options, i.e. -lualatex and -xelatex
      if (outputFormat === 'pdf' && engine.match(PDF_ENGINE_PATTERN)) {
        args.push(`-${engine}`)
      } else {
        // Keep the option noise to a minimum by not passing default engine
        if (engine !== 'pdflatex') {
          args.push(`-pdflatex="${engine}"`)
        }
        args.push(`-${outputFormat}`)
      }
    }

    let outdir = this.getOutputDirectory(filePath)
    if (outdir) {
      args.push(`-outdir="${outdir}"`)
    }

    args.push(`"${filePath}"`)
    return args
  }

  constructPdfProducerArgs (filePath) {
    const producer = this.getProducer(filePath)

    switch (producer) {
      case 'ps2pdf':
        return '-pdfps'
      case 'dvipdf':
        return '-pdfdvi -e "$dvipdf = \'dvipdf %O %S %D\';"'
      default:
        return `-pdfdvi -e "$dvipdf = '${producer} %O -o %D %S';"`
    }
  }
}
