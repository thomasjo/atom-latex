/** @babel */

import helpers from '../spec-helpers'
import fs from 'fs-plus'
import path from 'path'
import KnitrBuilder from '../../lib/builders/knitr'
import BuildState from '../../lib/build-state'

function getRawFile (filePath) {
  return fs.readFileSync(filePath, {encoding: 'utf-8'})
}

describe('KnitrBuilder', () => {
  let builder, fixturesPath, filePath, state, jobState

  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
    builder = new KnitrBuilder()
    spyOn(builder, 'logStatusCode').andCallThrough()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'knitr', 'file.Rnw')
    state = new BuildState(filePath)
    state.setEngine('pdflatex')
    state.setOutputFormat('pdf')
    state.setOutputDirectory('')
    jobState = state.getJobStates()[0]
  })

  describe('constructArgs', () => {
    it('produces default arguments containing expected file path', () => {
      const expectedArgs = [
        '-e "library(knitr)"',
        '-e "opts_knit$set(concordance = TRUE)"',
        `-e "knit('${filePath.replace(/\\/g, '\\\\')}')"`
      ]

      const args = builder.constructArgs(jobState)
      expect(args).toEqual(expectedArgs)
    })
  })

  describe('constructPatchSynctexArgs', () => {
    it('produces default arguments containing expected file path', () => {
      const escapedFilePath = filePath.replace(/\\/g, '\\\\')
      const escapedSynctexPath = escapedFilePath.replace(/\.[^.]+$/, '')
      const expectedArgs = [
        '-e "library(patchSynctex)"',
        `-e "patchSynctex('${escapedFilePath}',syncfile='${escapedSynctexPath}')"`
      ]

      const args = builder.constructPatchSynctexArgs(jobState)
      expect(args).toEqual(expectedArgs)
    })
  })

  describe('run', () => {
    let exitCode

    it('successfully executes knitr when given a valid R Sweave file', () => {
      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        const outputFilePath = path.join(fixturesPath, 'knitr', 'file.tex')

        expect(exitCode).toBe(0)
        expect(builder.logStatusCode).not.toHaveBeenCalled()
        expect(getRawFile(outputFilePath)).toContain('$\\tau \\approx 6.2831853$')
      })
    })

    it('fails to execute knitr when given an invalid file path', () => {
      filePath = path.join(fixturesPath, 'foo.Rnw')
      state.setFilePath(filePath)

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(1)
        expect(builder.logStatusCode).toHaveBeenCalled()
      })
    })

    it('detects missing knitr library and logs an error', () => {
      const directoryPath = path.dirname(filePath)
      const env = { 'R_LIBS_USER': '/dev/null', 'R_LIBS_SITE': '/dev/null' }
      const options = builder.constructChildProcessOptions(directoryPath)
      Object.assign(options.env, env)
      spyOn(builder, 'constructChildProcessOptions').andReturn(options)
      spyOn(latex.log, 'showMessage').andCallThrough()

      waitsForPromise(() => {
        return builder.run(jobState).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(-1)
        expect(builder.logStatusCode).toHaveBeenCalled()
        expect(latex.log.showMessage).toHaveBeenCalledWith({
          type: 'error',
          text: 'The R package "knitr" could not be loaded.'
        })
      })
    })
  })

  describe('resolveOutputPath', () => {
    let sourcePath, resultPath

    beforeEach(() => {
      sourcePath = path.resolve('/var/foo.Rnw')
      resultPath = path.resolve('/var/foo.tex')
    })

    it('detects an absolute path and returns it unchanged', () => {
      const stdout = `foo\nbar\n\n[1] "${resultPath}"`
      const resolvedPath = builder.resolveOutputPath(sourcePath, stdout)

      expect(resolvedPath).toBe(resultPath)
    })

    it('detects a relative path and makes it absolute with respect to the source file', () => {
      const stdout = `foo\nbar\n\n[1] "${path.basename(resultPath)}"`
      const resolvedPath = builder.resolveOutputPath(sourcePath, stdout)

      expect(resolvedPath).toBe(resultPath)
    })
  })

  describe('canProcess', () => {
    it('returns true when given a file path with a .Rnw extension', () => {
      const canProcess = KnitrBuilder.canProcess(state)
      expect(canProcess).toBe(true)
    })
  })
})
