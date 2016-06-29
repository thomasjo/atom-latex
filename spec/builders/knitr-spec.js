'use babel'

import helpers from '../spec-helpers'
import fs from 'fs-plus'
import path from 'path'
import KnitrBuilder from '../../lib/builders/knitr'

function getRawFile (filePath) {
  return fs.readFileSync(filePath, {encoding: 'utf-8'})
}

describe('KnitrBuilder', () => {
  let builder, fixturesPath, filePath, outputFilePath

  beforeEach(() => {
    builder = new KnitrBuilder()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'knitr', 'file.Rnw')
    outputFilePath = path.join(fixturesPath, 'knitr', 'file.tex')
  })

  describe('constructArgs', () => {
    it('produces default arguments containing expected file path', () => {
      const expectedArgs = [
        '--default-packages=knitr',
        `-e "knit('${filePath}', '${outputFilePath}')"`
      ]

      const args = builder.constructArgs(filePath)
      expect(args).toEqual(expectedArgs)
    })
  })

  describe('run', () => {
    let exitCode

    it('successfully executes Knitr when given a valid R Sweave file', () => {
      waitsForPromise(() => {
        return builder.run(filePath).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(0)
        expect(getRawFile(outputFilePath)).toContain('$\\tau \\approx 6.2831853$')
      })
    })

    it('fails to execute Knitr when given an invalid file path', () => {
      filePath = path.join(fixturesPath, 'foo.tex')

      waitsForPromise(() => {
        return builder.run(filePath).then(code => { exitCode = code })
      })

      runs(() => {
        expect(exitCode).toBe(1)
      })
    })
  })
})
