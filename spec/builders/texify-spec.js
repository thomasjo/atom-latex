/** @babel */

import helpers from '../spec-helpers'
import path from 'path'
import TexifyBuilder from '../../lib/builders/texify'
import _ from 'lodash'

// This should probably try to detect texify
if (process.env.TEX_DIST === 'miktex') {
  describe('TexifyBuilder', () => {
    let builder, fixturesPath, filePath

    beforeEach(() => {
      builder = new TexifyBuilder()
      fixturesPath = helpers.cloneFixtures()
      filePath = path.join(fixturesPath, 'file.tex')
    })

    describe('constructArgs', () => {
      it('produces default arguments when package has default config values', () => {
        const expectedArgs = [
          '--batch',
          '--pdf',
          '--tex-option="--interaction=nonstopmode"',
          '--tex-option="--max-print-line=1000"',
          '--tex-option="--synctex=1"',
          `"${filePath}"`
        ]
        const args = builder.constructArgs(filePath)

        expect(args).toEqual(expectedArgs)
      })

      it('adds -shell-escape flag when package config value is set', () => {
        atom.config.set('latex.enableShellEscape', true)
        expect(builder.constructArgs(filePath)).toContain('--tex-option=--enable-write18')
      })

      it('disables synctex according to package config', () => {
        atom.config.set('latex.enableSynctex', false)
        expect(builder.constructArgs(filePath)).not.toContain('--tex-option="--synctex=1"')
      })

      it('adds engine argument according to package config', () => {
        atom.config.set('latex.engine', 'lualatex')
        expect(builder.constructArgs(filePath)).toContain('--engine=luatex')
      })

      it('adds a custom engine string according to package config', () => {
        atom.config.set('latex.customEngine', 'pdflatex %O %S')
        expect(builder.constructArgs(filePath)).toContain('--engine="pdflatex %O %S"')
      })
    })

    describe('run', () => {
      let exitCode, parsedLog

      it('successfully executes texify when given a valid TeX file', () => {
        waitsForPromise(() => {
          return builder.run(filePath).then(code => { exitCode = code })
        })

        runs(() => {
          expect(exitCode).toBe(0)
        })
      })

      it('successfully executes texify when given a file path containing spaces', () => {
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

          expect(exitCode).toBe(1)
        })
      })

      it('fails to execute texify when given invalid arguments', () => {
        spyOn(builder, 'constructArgs').andReturn(['-invalid-argument'])

        waitsForPromise(() => {
          return builder.run(filePath).then(code => { exitCode = code })
        })

        runs(() => {
          expect(exitCode).toBe(1)
        })
      })

      it('fails to execute texify when given invalid file path', () => {
        filePath = path.join(fixturesPath, 'foo.tex')
        const args = builder.constructArgs(filePath)

        spyOn(builder, 'constructArgs').andReturn(args)

        waitsForPromise(() => {
          return builder.run(filePath).then(code => { exitCode = code })
        })

        runs(() => {
          expect(exitCode).toBe(1)
        })
      })
    })
  })
}
