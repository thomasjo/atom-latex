/** @babel */

import '../spec-helpers'

import path from 'path'
import FdbParser from '../../lib/parsers/fdb-parser'

describe('FdbParser', () => {
  let fixturesPath, fdbFile, texFile

  beforeEach(() => {
    fixturesPath = atom.project.getPaths()[0]
    fdbFile = path.join(fixturesPath, 'file.fdb_latexmk')
    texFile = path.join(fixturesPath, 'file.tex')
  })

  describe('parse', () => {
    it('returns the expected generated files', () => {
      const parser = new FdbParser(fdbFile, texFile)
      const result = parser.parse()
      const expectedResult = {
        pdflatex: [
          '/foo/output/file.pdfsync',
          '/foo/output/file.pdf',
          'output/file.log',
          'output/file.pdf',
          '/foo/output/file.log',
          'output/file.aux'
        ]
      }

      expect(result).toEqual(expectedResult)
    })
  })

  describe('getLines', () => {
    it('returns the expected number of lines', () => {
      const fdbFile = path.join(fixturesPath, 'file.fdb_latexmk')
      const texFile = path.join(fixturesPath, 'file.tex')
      const parser = new FdbParser(fdbFile, texFile)
      const lines = parser.getLines()

      expect(lines.length).toBe(28)
    })

    it('throws an error when passed a filepath that does not exist', () => {
      const fdbFile = path.join(fixturesPath, 'nope.fdb_latexmk')
      const texFile = path.join(fixturesPath, 'nope.tex')
      const parser = new FdbParser(fdbFile, texFile)

      expect(parser.getLines).toThrow()
    })
  })
})
