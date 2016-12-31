/** @babel */

import '../spec-helpers'

import path from 'path'
import SecondaryLogParser from '../../lib/parsers/secondary-log-parser'

describe('SecondaryLogParser', () => {
  let fixturesPath

  beforeEach(() => {
    fixturesPath = path.join(atom.project.getPaths()[0], 'secondary-log')
  })

  describe('parse', () => {
    it('parses Biber log file and returns all messages', () => {
      const logPath = path.join(fixturesPath, 'biber.blg')
      const texPath = path.join(fixturesPath, 'biblatex.tex')
      const parser = new SecondaryLogParser(logPath, texPath)
      const expectedResult = [{
        type: 'info',
        text: 'This is Biber 2.6',
        logPath,
        logRange: [[0, 0], [1, 43]]
      }, {
        type: 'info',
        text: 'Logfile is \'biber.blg\'',
        logPath,
        logRange: [[1, 0], [2, 48]]
      }, {
        type: 'info',
        text: '=== Sat Dec 31, 2016, 09:22:00',
        logPath,
        logRange: [[2, 0], [3, 53]]
      }, {
        type: 'info',
        text: 'Reading \'biber.bcf\'',
        logPath,
        logRange: [[3, 0], [4, 45]]
      }, {
        type: 'info',
        text: 'Found 1 citekeys in bib section 0',
        logPath,
        logRange: [[4, 0], [5, 60]]
      }, {
        type: 'info',
        text: 'Processing section 0',
        logPath,
        logRange: [[5, 0], [6, 48]]
      }, {
        type: 'info',
        text: 'Looking for bibtex format file \'biblatex.bib\' for section 0',
        logPath,
        logRange: [[6, 0], [7, 87]]
      }, {
        type: 'info',
        text: 'Decoding LaTeX character macros into UTF-8',
        logPath,
        logRange: [[7, 0], [8, 71]]
      }, {
        type: 'info',
        text: 'Found BibTeX data source \'biblatex.bib\'',
        logPath,
        logRange: [[8, 0], [9, 68]
        ]
      }, {
        type: 'warning',
        text: 'Entry wibble does not parse correctly',
        logPath,
        logRange: [[9, 0], [10, 64]]
      }, {
        type: 'error',
        text: 'BibTeX subsystem: /tmp/SLmeMjvpji/biblatex.bib_10398.utf8, line 4, syntax error: found "author", expected end of entry ("}" or ")") (skipping to next "@")',
        logPath,
        logRange: [[10, 0], [11, 182]]
      }, {
        type: 'info',
        text: 'WARNINGS: 1',
        logPath,
        logRange: [[11, 0], [12, 38]]
      }, {
        type: 'info',
        text: 'ERRORS: 1',
        logPath,
        logRange: [[12, 0], [13, 36]]
      }]

      const result = parser.parse()

      expect(result).toEqual(expectedResult)
    })

    it('parses and returns all errors', () => {
      const logPath = path.join(fixturesPath, 'bibtex.blg')
      const texPath = path.join(fixturesPath, 'biblatex.tex')
      const filePath = path.join(fixturesPath, 'biblatex.bib')
      const parser = new SecondaryLogParser(logPath, texPath)
      const expectedResult = [{
        type: 'error',
        text: 'I was expecting a `,\' or a `}\'',
        range: [[4, 0], [4, 65536]],
        filePath,
        logPath,
        logRange: [[20, 0], [21, 60]]
      }, {
        type: 'error',
        text: 'A bad cross reference---entry "wibble" refers to entry "bar", which doesn\'t exist',
        logRange: [[25, 0], [26,
          42]],
        logPath
      }, {
        type: 'warning',
        text: 'I didn\'t find a database entry for "bar"',
        logPath,
        logRange: [[27, 0], [28, 49]]
      }]

      const result = parser.parse()

      expect(result).toEqual(expectedResult)
    })
  })
})
