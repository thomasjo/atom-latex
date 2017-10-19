/** @babel */

import helpers from '../spec-helpers'
import path from 'path'
import LatexmkBuilder from '../../lib/builders/latexmk'
import fs from 'fs-plus'
import BuildState from '../../lib/build-state'

describe('LatexmkBuilder', () => {
  let builder, fixturesPath, filePath, extendedOutputPaths, state, jobState

  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
    builder = new LatexmkBuilder()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
    state = new BuildState(filePath)
    state.setEngine('pdflatex')
    state.setOutputFormat('pdf')
    state.setOutputDirectory('')
    state.setEnableSynctex(true)
    state.setEnableExtendedBuildMode(true)
    jobState = state.getJobStates()[0]
  })

  function initializeExtendedBuild (name, extensions, outputDirectory = '') {
    let dir = path.join(fixturesPath, 'latexmk')
    filePath = path.format({ dir, name, ext: '.tex' })
    state.setFilePath(filePath)
    dir = path.join(dir, outputDirectory)
    state.setOutputDirectory(outputDirectory)
    extendedOutputPaths = extensions.map(ext => path.format({ dir, name, ext }))
  }

  function expectExistenceOfExtendedOutputs () {
    for (const output of extendedOutputPaths) {
      expect(fs.existsSync(output)).toBe(true, `Check the existence of ${output} file.`)
    }
  }

  describe('constructArgs', () => {
    it('produces default arguments when package has default config values', () => {
      const latexmkrcPath = path.resolve(__dirname, '..', '..', 'resources', 'latexmkrc')
      const expectedArgs = [
        '-interaction=nonstopmode',
        '-f',
        '-cd',
        '-file-line-error',
        '-synctex=1',
        `-r "${latexmkrcPath}"`,
        '-pdf',
        `"${filePath}"`
      ]
      const args = builder.constructArgs(jobState)

      expect(args).toEqual(expectedArgs)
    })

    it('adds -g flag when rebuild is passed', () => {
      state.setShouldRebuild(true)
      expect(builder.constructArgs(jobState)).toContain('-g')
    })

    it('adds -shell-escape flag when package config value is set', () => {
      state.setEnableShellEscape(true)
      expect(builder.constructArgs(jobState)).toContain('-shell-escape')
    })

    it('disables synctex according to package config', () => {
      state.setEnableSynctex(false)
      expect(builder.constructArgs(jobState)).not.toContain('-synctex=1')
    })

    it('adds -outdir=<path> argument according to package config', () => {
      const outdir = 'bar'
      const expectedArg = `-outdir="${outdir}"`
      state.setOutputDirectory(outdir)

      expect(builder.constructArgs(jobState)).toContain(expectedArg)
    })

    it('adds lualatex argument according to package config', () => {
      state.setEngine('lualatex')
      expect(builder.constructArgs(jobState)).toContain('-lualatex')
    })

    it('adds xelatex argument according to package config', () => {
      state.setEngine('xelatex')
      expect(builder.constructArgs(jobState)).toContain('-xelatex')
    })

    it('adds a custom engine string according to package config', () => {
      state.setEngine('pdflatex %O %S')
      expect(builder.constructArgs(jobState)).toContain('-pdflatex="pdflatex %O %S"')
    })

    it('adds -ps and removes -pdf arguments according to package config', () => {
      state.setOutputFormat('ps')
      const args = builder.constructArgs(jobState)
      expect(args).toContain('-ps')
      expect(args).not.toContain('-pdf')
    })

    it('adds -dvi and removes -pdf arguments according to package config', () => {
      state.setOutputFormat('dvi')
      const args = builder.constructArgs(jobState)
      expect(args).toContain('-dvi')
      expect(args).not.toContain('-pdf')
    })

    it('adds latex dvipdfmx arguments according to package config', () => {
      state.setEngine('uplatex')
      state.setProducer('dvipdfmx')
      const args = builder.constructArgs(jobState)
      expect(args).toContain('-latex="uplatex"')
      expect(args).toContain('-pdfdvi -e "$dvipdf = \'dvipdfmx %O -o %D %S\';"')
      expect(args).not.toContain('-pdf')
    })

    it('adds latex dvipdf arguments according to package config', () => {
      state.setEngine('uplatex')
      state.setProducer('dvipdf')
      const args = builder.constructArgs(jobState)
      expect(args).toContain('-latex="uplatex"')
      expect(args).toContain('-pdfdvi -e "$dvipdf = \'dvipdf %O %S %D\';"')
      expect(args).not.toContain('-pdf')
    })

    it('adds latex ps arguments according to package config', () => {
      state.setEngine('uplatex')
      state.setProducer('ps2pdf')
      const args = builder.constructArgs(jobState)
      expect(args).toContain('-latex="uplatex"')
      expect(args).toContain('-pdfps')
      expect(args).not.toContain('-pdf')
    })

    it('removes latexmkrc argument according to package config', () => {
      state.setEnableExtendedBuildMode(false)
      const args = builder.constructArgs(jobState)
      const latexmkrcPath = path.resolve(__dirname, '..', '..', 'resources', 'latexmkrc')
      expect(args).not.toContain(`-r "${latexmkrcPath}"`)
    })

    it('adds a jobname argument when passed a non-null jobname', () => {
      state.setJobNames(['foo'])
      jobState = state.getJobStates()[0]
      expect(builder.constructArgs(jobState)).toContain('-jobname="foo"')
    })
  })

  describe('run', () => {
    let exitCode

    beforeEach(() => {
      spyOn(builder, 'logStatusCode').andCallThrough()
    })

    it('successfully executes latexmk when given a valid TeX file', () => {
      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expect(exitCode).toBe(0)
      })
    })

    it('successfully executes latexmk when given a file path containing spaces', () => {
      filePath = path.join(fixturesPath, 'filename with spaces.tex')
      state.setFilePath(filePath)

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expect(exitCode).toBe(0)
      })
    })

    it('successfully executes latexmk when given a jobname', () => {
      state.setJobNames(['foo'])
      jobState = state.getJobStates()[0]

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expect(exitCode).toBe(0)
      })
    })

    it('successfully executes latexmk when given a jobname with spaces', () => {
      state.setJobNames(['foo bar'])
      jobState = state.getJobStates()[0]

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expect(exitCode).toBe(0)
      })
    })

    it('fails with code 12 and various errors, warnings and info messages are produced in log file', () => {
      filePath = path.join(fixturesPath, 'error-warning.tex')
      state.setFilePath(filePath)
      const subFilePath = path.join(fixturesPath, 'sub', 'wibble.tex')
      const spacesFilePath = path.join(fixturesPath, 'sub', 'foo bar.tex')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => {
          exitCode = code
          builder.parseLogFile(jobState)
        })
      })

      runs(() => {
        const logMessages = jobState.getLogMessages()
        const messages = [
          { type: 'error', text: 'There\'s no line here to end', filePath },
          { type: 'error', text: 'Argument of \\@sect has an extra }', filePath },
          { type: 'error', text: 'Paragraph ended before \\@sect was complete', filePath },
          { type: 'error', text: 'Extra alignment tab has been changed to \\cr', filePath },
          { type: 'warning', text: 'Reference `tab:snafu\' on page 1 undefined', filePath: subFilePath },
          { type: 'error', text: 'Class foo: Significant class issue', filePath: spacesFilePath },
          { type: 'warning', text: 'Class foo: Class issue', filePath: spacesFilePath },
          { type: 'warning', text: 'Class foo: Nebulous class issue', filePath: spacesFilePath },
          { type: 'info', text: 'Class foo: Insignificant class issue', filePath: spacesFilePath },
          { type: 'error', text: 'Package bar: Significant package issue', filePath: subFilePath },
          { type: 'warning', text: 'Package bar: Package issue', filePath: subFilePath },
          { type: 'warning', text: 'Package bar: Nebulous package issue', filePath: subFilePath },
          { type: 'info', text: 'Package bar: Insignificant package issue', filePath: subFilePath },
          { type: 'warning', text: 'There were undefined references', filePath }
        ]

        // Loop through the required messages and make sure that each one appears
        // in the parsed log output. We do not do a direct one-to-one comparison
        // since there will likely be font messages which may be dependent on
        // which TeX distribution is being used or which fonts are currently
        // installed.
        for (const message of messages) {
          expect(logMessages.some(
            logMessage => message.type === logMessage.type && message.text === logMessage.text && message.filePath === logMessage.filePath)).toBe(true, `Message = ${message.text}`)
        }

        expect(logMessages.every(
          logMessage => !logMessage.filePath || logMessage.filePath === filePath || logMessage.filePath === subFilePath || logMessage.filePath === spacesFilePath))
          .toBe(true, 'Incorrect file path resolution in log.')

        expect(builder.logStatusCode).toHaveBeenCalled()
        expect(exitCode).toBe(12)
      })
    })

    it('fails to execute latexmk when given invalid arguments', () => {
      spyOn(builder, 'constructArgs').andReturn(['-invalid-argument'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(10)
        expect(builder.logStatusCode).toHaveBeenCalled()
      })
    })

    it('fails to execute latexmk when given invalid file path', () => {
      state.setFilePath(path.join(fixturesPath, 'foo.tex'))
      const args = builder.constructArgs(jobState)

      // Need to remove the 'force' flag to trigger the desired failure.
      const removed = args.splice(1, 1)
      expect(removed).toEqual(['-f'])

      spyOn(builder, 'constructArgs').andReturn(args)

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(11)
        expect(builder.logStatusCode).toHaveBeenCalled()
      })
    })

    it('successfully creates asymptote files when using the asymptote package', () => {
      initializeExtendedBuild('asymptote-test',
        ['-1.tex', '.pdf'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates asymptote files when using the asymptote package with an output directory', () => {
      initializeExtendedBuild('asymptote-test',
        ['-1.tex', '.pdf'],
        'build')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates glossary files when using the glossaries package', () => {
      initializeExtendedBuild('glossaries-test',
        ['.acn', '.acr', '.glo', '.gls', '.pdf'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates glossary files when using the glossaries package with an output directory', () => {
      initializeExtendedBuild('glossaries-test',
        ['.acn', '.acr', '.glo', '.gls', '.pdf'],
        'build')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates metapost files when using the feynmp package', () => {
      initializeExtendedBuild('mpost-test',
        ['-feynmp.1', '.pdf'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates metapost files when using the feynmp package with an output directory', () => {
      initializeExtendedBuild('mpost-test',
        ['-feynmp.1', '.pdf'],
        'build')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates nomenclature files when using the nomencl package', () => {
      initializeExtendedBuild('nomencl-test',
        ['.nlo', '.nls', '.pdf'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates nomenclature files when using the nomencl package with an output directory', () => {
      initializeExtendedBuild('nomencl-test',
        ['.nlo', '.nls', '.pdf'],
        'build')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates index files when using the index package', () => {
      initializeExtendedBuild('index-test',
        ['.idx', '.ind', '.ldx', '.lnd', '.pdf'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates index files when using the index package with an output directory', () => {
      initializeExtendedBuild('index-test',
        ['.idx', '.ind', '.ldx', '.lnd', '.pdf'],
        'build')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    // Sage only runs in a VM on Windows and installing Sage at 1GB for two tests
    // is excessive.
    if (process.platform === 'win32' || process.env.CI) return

    it('successfully creates SageTeX files when using the sagetex package', () => {
      initializeExtendedBuild('sagetex-test',
        ['.sagetex.sage', '.sagetex.sout', '.pdf'])

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })

    it('successfully creates SageTeX files when using the sagetex package with an output directory', () => {
      initializeExtendedBuild('sagetex-test',
        ['.sagetex.sage', '.sagetex.sout', '.pdf'],
        'build')

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expectExistenceOfExtendedOutputs()
      })
    })
  })

  describe('canProcess', () => {
    it('returns true when given a file path with a .tex extension', () => {
      const canProcess = LatexmkBuilder.canProcess(state)
      expect(canProcess).toBe(true)
    })
  })

  describe('logStatusCode', () => {
    it('handles latexmk specific status codes', () => {
      let messages = []
      spyOn(latex.log, 'error').andCallFake(message => messages.push(message))

      const statusCodes = [10, 11, 12, 13, 20]
      statusCodes.forEach(statusCode => builder.logStatusCode(statusCode))

      const startsWithPrefix = str => str.startsWith('latexmk:')

      expect(messages.length).toBe(statusCodes.length)
      expect(messages.filter(startsWithPrefix).length).toBe(statusCodes.length)
    })

    it('passes through to superclass when given non-latexmk status codes', () => {
      const stderr = 'wibble'
      const superclass = Object.getPrototypeOf(builder)
      spyOn(superclass, 'logStatusCode').andCallThrough()

      const statusCode = 1
      builder.logStatusCode(statusCode, stderr)

      expect(superclass.logStatusCode).toHaveBeenCalledWith(statusCode, stderr)
    })
  })
})
