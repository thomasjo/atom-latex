/** @babel */

import '../spec-helpers'

import path from 'path'
import BiberLogParser from '../../lib/parsers/biber-log-parser'

describe('BiberLogParser', () => {
  let fixturesPath

  beforeEach(() => {
    fixturesPath = path.join(atom.project.getPaths()[0], 'bib')
  })

  describe('parse', () => {
    it('parses and returns all errors', () => {
      const logPath = path.join(fixturesPath, 'biber.blg')
      const texPath = path.join(fixturesPath, 'foo.tex')
      const parser = new BiberLogParser(logPath, texPath)
      const expectedResult = [{
        type: 'info',
        text: 'This is Biber 2.6',
        logPath,
        logRange: [[0, 0], [0, 43]]
      }, {
        type: 'info',
        text: 'Logfile is \'biber.blg\'',
        logPath,
        logRange: [[1, 0], [1, 48]]
      }, {
        type: 'info',
        text: '=== Thu Dec 29, 2016, 13:21:57',
        logPath,
        logRange: [[2, 0], [2, 53]]
      }, {
        type: 'info',
        text: 'Reading \'biber.bcf\'',
        logPath,
        logRange: [[3, 0], [3, 45]]
      }, {
        type: 'info',
        text: 'Found 1 citekeys in bib section 0',
        logPath,
        logRange: [[4, 0], [4, 60]]
      }, {
        type: 'info',
        text: 'Processing section 0',
        logPath,
        logRange: [[5, 0], [5, 48]]
      }, {
        type: 'info',
        text: 'Looking for bibtex format file \'foo.bib\' for section 0',
        logPath,
        logRange: [[6, 0], [6, 82]]
      }, {
        type: 'info',
        text: 'Decoding LaTeX character macros into UTF-8',
        logPath,
        logRange: [[7, 0], [7, 71]]
      }, {
        type: 'info',
        text: 'Found BibTeX data source \'foo.bib\'',
        logPath,
        logRange: [[8, 0], [8, 63]]
      }, {
        type: 'warning',
        text: 'Entry wibble does not parse correctly',
        logPath,
        logRange: [[9, 0], [9, 64]]
      }, {
        type: 'error',
        text: 'BibTeX subsystem: /tmp/ftSAx2kR1C/foo.bib_24387.utf8, line 4, syntax error: found "author", expected end of entry ("}" or ")") (skipping to next "@")',
        logPath,
        logRange: [[10, 0], [10, 177]]
      }, {
        type: 'info',
        text: 'WARNINGS: 1',
        logPath,
        logRange: [[11, 0], [11, 38]]
      }, {
        type: 'info',
        text: 'ERRORS: 1',
        logPath,
        logRange: [[12, 0], [12, 36]]
      }]

      const result = parser.parse()

      expect(result).toEqual(expectedResult)
    })
  })
})
