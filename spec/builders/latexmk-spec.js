/** @babel */

import fs from 'fs-plus'
import helpers from '../spec-helpers'
import path from 'path'
import LatexmkBuilder from '../../lib/builders/latexmk'
import _ from 'lodash'
import { BUILD_ACTION, REBUILD_ACTION, CLEAN_ACTION, FULL_CLEAN_ACTION } from '../../lib/actions'

describe('LatexmkBuilder', () => {
  let builder, fixturesPath, filePath

  async function runActions (filePath, actions, jobname) {
    function dirDiff (currentFiles, previousFiles) {
      return {
        created: _.difference(currentFiles, previousFiles),
        deleted: _.difference(previousFiles, currentFiles)
      }
    }

    const dirPath = path.dirname(filePath)
    const initialFiles = fs.readdirSync(dirPath)
    let previousFiles = initialFiles
    const results = {}

    for (const action of actions) {
      await builder.run(filePath, action, jobname)
      const currentFiles = fs.readdirSync(dirPath)
      results[action] = dirDiff(currentFiles, previousFiles)
      previousFiles = currentFiles
    }

    results.overall = dirDiff(previousFiles, initialFiles)

    return results
  }

  beforeEach(() => {
    builder = new LatexmkBuilder()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
    atom.config.set('latex.engine', 'pdflatex')
    atom.config.set('latex.outputFormat', 'pdf')
    atom.config.set('latex.cleanExtensions', [])
  })

  describe('constructArgs', () => {
    it('produces default arguments when package has default config values', () => {
      const expectedArgs = [
        '-interaction=nonstopmode',
        '-f',
        '-cd',
        '-file-line-error',
        '-synctex=1',
        '-pdflatex="pdflatex"',
        '-pdf',
        `"${filePath}"`
      ]
      const args = builder.constructArgs(filePath)

      expect(args).toEqual(expectedArgs)
    })

    it('adds -g flag when rebuild is passed', () => {
      expect(builder.constructArgs(filePath, REBUILD_ACTION)).toContain('-g')
    })

    it('adds -c flag when clean is passed', () => {
      expect(builder.constructArgs(filePath, CLEAN_ACTION)).toContain('-c')
    })

    it('adds -C flag when full clean is passed', () => {
      expect(builder.constructArgs(filePath, FULL_CLEAN_ACTION)).toContain('-c')
    })

    it('adds cleanExtensions flag when clean is passed', () => {
      atom.config.set('latex.cleanExtensions', ['foo', 'bar'])
      expect(builder.constructArgs(filePath, CLEAN_ACTION)).toContain('-c -e "\\$clean_ext=\'foo bar\'"')
    })

    it('adds -shell-escape flag when package config value is set', () => {
      atom.config.set('latex.enableShellEscape', true)
      expect(builder.constructArgs(filePath)).toContain('-shell-escape')
    })

    it('disables synctex according to package config', () => {
      atom.config.set('latex.enableSynctex', false)
      expect(builder.constructArgs(filePath)).not.toContain('-synctex=1')
    })

    it('adds -outdir=<path> argument according to package config', () => {
      const outdir = 'bar'
      const expectedArg = `-outdir="${path.join(fixturesPath, outdir)}"`
      atom.config.set('latex.outputDirectory', outdir)

      expect(builder.constructArgs(filePath)).toContain(expectedArg)
    })

    it('adds pdflatex arguments according to package config', () => {
      atom.config.set('latex.engine', 'lualatex')
      expect(builder.constructArgs(filePath)).toContain('-pdflatex="lualatex"')
    })

    it('adds a custom engine string according to package config', () => {
      atom.config.set('latex.customEngine', 'pdflatex %O %S')
      expect(builder.constructArgs(filePath)).toContain('-pdflatex="pdflatex %O %S"')
    })

    it('adds -ps and removes -pdf arguments according to package config', () => {
      atom.config.set('latex.outputFormat', 'ps')
      const args = builder.constructArgs(filePath)
      expect(args).toContain('-ps')
      expect(args).not.toContain('-pdf')
    })

    it('adds -dvi and removes -pdf arguments according to package config', () => {
      atom.config.set('latex.outputFormat', 'dvi')
      const args = builder.constructArgs(filePath)
      expect(args).toContain('-dvi')
      expect(args).not.toContain('-pdf')
    })

    it('adds latex dvipdfmx arguments according to package config', () => {
      atom.config.set('latex.engine', 'uplatex')
      atom.config.set('latex.producer', 'dvipdfmx')
      const args = builder.constructArgs(filePath)
      expect(args).toContain('-latex="uplatex"')
      expect(args).toContain('-pdfdvi -e "\\$dvipdf=\'dvipdfmx %O -o %D %S\';"')
      expect(args).not.toContain('-pdf')
    })

    it('adds latex dvipdf arguments according to package config', () => {
      atom.config.set('latex.engine', 'uplatex')
      atom.config.set('latex.producer', 'dvipdf')
      const args = builder.constructArgs(filePath)
      expect(args).toContain('-latex="uplatex"')
      expect(args).toContain('-pdfdvi -e "\\$dvipdf=\'dvipdf %O %S %D\';"')
      expect(args).not.toContain('-pdf')
    })

    it('adds latex ps arguments according to package config', () => {
      atom.config.set('latex.engine', 'uplatex')
      atom.config.set('latex.producer', 'ps2pdf')
      const args = builder.constructArgs(filePath)
      expect(args).toContain('-latex="uplatex"')
      expect(args).toContain('-pdfps')
      expect(args).not.toContain('-pdf')
    })

    it('adds a jobname argument when passed a non-null jobname', () => {
      expect(builder.constructArgs(filePath, BUILD_ACTION, 'foo')).toContain('-jobname=foo')
    })
  })

  describe('run', () => {
    let exitCode, parsedLog

    it('successfully executes latexmk when given a valid TeX file', () => {
      waitsForPromise(() => {
        return builder.run(filePath).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
      })
    })

    it('successfully executes latexmk when given a file path containing spaces', () => {
      filePath = path.join(fixturesPath, 'filename with spaces.tex')

      waitsForPromise(() => {
        return builder.run(filePath).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
      })
    })

    it('fails with code 12 and various errors, warnings and info messages are produced in log file', () => {
      filePath = path.join(fixturesPath, 'error-warning.tex')

      waitsForPromise(() => {
        return builder.run(filePath).then(code => {
          exitCode = code
          parsedLog = builder.parseLogFile(filePath)
        })
      })

      runs(() => {
        const messages = [
          { type: 'Error', text: 'There\'s no line here to end' },
          { type: 'Error', text: 'Argument of \\@sect has an extra }' },
          { type: 'Error', text: 'Paragraph ended before \\@sect was complete' },
          { type: 'Error', text: 'Extra alignment tab has been changed to \\cr' },
          { type: 'Warning', text: 'Reference `tab:snafu\' on page 1 undefined' },
          { type: 'Error', text: 'Class foo: Significant class issue' },
          { type: 'Warning', text: 'Class foo: Class issue' },
          { type: 'Warning', text: 'Class foo: Nebulous class issue' },
          { type: 'Info', text: 'Class foo: Insignificant class issue' },
          { type: 'Error', text: 'Package bar: Significant package issue' },
          { type: 'Warning', text: 'Package bar: Package issue' },
          { type: 'Warning', text: 'Package bar: Nebulous package issue' },
          { type: 'Info', text: 'Package bar: Insignificant package issue' },
          { type: 'Warning', text: 'There were undefined references' }
        ]

        // Loop through the required messages and make sure that each one appears
        // in the parsed log output. We do not do a direct one-to-one comparison
        // since there will likely be font messages which may be dependent on
        // which TeX distribution is being used or which fonts are currently
        // installed.
        for (const message of messages) {
          expect(_.some(parsedLog.messages,
            logMessage => message.type === logMessage.type && message.text === logMessage.text)).toBe(true, `Message = ${message.text}`)
        }

        expect(exitCode).toBe(12)
      })
    })

    it('fails to execute latexmk when given invalid arguments', () => {
      spyOn(builder, 'constructArgs').andReturn(['-invalid-argument'])

      waitsForPromise(() => {
        return builder.run(filePath).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(10)
      })
    })

    it('fails to execute latexmk when given invalid file path', () => {
      filePath = path.join(fixturesPath, 'foo.tex')
      const args = builder.constructArgs(filePath)

      // Need to remove the 'force' flag to trigger the desired failure.
      const removed = args.splice(1, 1)
      expect(removed).toEqual(['-f'])

      spyOn(builder, 'constructArgs').andReturn(args)

      waitsForPromise(() => {
        return builder.run(filePath).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(11)
      })
    })

    it('Leaves PDF and SyncTeX files and removes others during a normal clean', () => {
      let results
      waitsForPromise(() => {
        return runActions(filePath, [REBUILD_ACTION, CLEAN_ACTION], 'fubar').then(res => { results = res })
      })

      runs(() => {
        expect(results.overall.created).toEqual(['fubar.pdf', 'fubar.synctex.gz'])
        expect(results[CLEAN_ACTION].deleted).toEqual(['fubar.aux', 'fubar.fdb_latexmk', 'fubar.fls', 'fubar.log'])
      })
    })
  })
})
