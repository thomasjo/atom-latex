/** @babel */

import '../spec-helpers'

import path from 'path'
import FdbParser from '../../lib/parsers/fdb-parser'

describe('FdbParser', () => {
  let fixturesPath, fdbFile, texFile

  beforeEach(() => {
    fixturesPath = atom.project.getPaths()[0]
    fdbFile = path.join(fixturesPath, 'log-parse', 'file-pdfps.fdb_latexmk')
    texFile = path.join(fixturesPath, 'file.tex')
  })

  describe('parse', () => {
    it('returns the expected parsed fdb', () => {
      const parser = new FdbParser(fdbFile, texFile)
      const result = parser.parse()
      const expectedResult = {
        dvips: {
          source: ['log-parse/file-pdfps.dvi'],
          generated: ['log-parse/file-pdfps.ps']
        },
        latex: {
          source: ['file-pdfps.aux', 'file.tex'],
          generated: ['log-parse/file-pdfps.aux', 'log-parse/file-pdfps.log', 'log-parse/file-pdfps.dvi']
        },
        ps2pdf: {
          source: ['log-parse/file-pdfps.ps'],
          generated: ['log-parse/file-pdfps.pdf']
        }
      }

      expect(result).toEqual(expectedResult)
    })
  })

  describe('getLines', () => {
    it('returns the expected number of lines', () => {
      const parser = new FdbParser(fdbFile, texFile)
      const lines = parser.getLines()

      expect(lines.length).toBe(17)
    })

    it('throws an error when passed a filepath that does not exist', () => {
      const fdbFile = path.join(fixturesPath, 'nope.fdb_latexmk')
      const texFile = path.join(fixturesPath, 'nope.tex')
      const parser = new FdbParser(fdbFile, texFile)

      expect(parser.getLines).toThrow()
    })
  })
})
