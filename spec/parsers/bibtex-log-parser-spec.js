/** @babel */

import '../spec-helpers'

import path from 'path'
import BibtexLogParser from '../../lib/parsers/bibtex-log-parser'

describe('BibtexLogParser', () => {
  let fixturesPath

  beforeEach(() => {
    fixturesPath = path.join(atom.project.getPaths()[0], 'bib')
  })

  describe('parse', () => {
    it('parses and returns all errors', () => {
      const logPath = path.join(fixturesPath, 'bibtex.blg')
      const texPath = path.join(fixturesPath, 'foo.tex')
      const filePath = path.join(fixturesPath, 'foo.bib')
      const parser = new BibtexLogParser(logPath, texPath)
      const expectedResult = [{
        type: 'error',
        text: 'I was expecting a `,\' or a `}\'',
        filePath,
        range: [[4, 0], [4, 65536]],
        logPath,
        logRange: [[20, 0], [20, 55]]
      }, {
        type: 'error',
        text: 'A bad cross reference---entry "wibble" refers to entry "bar", which doesn\'t exist',
        logPath,
        logRange: [[25, 0], [26, 42]]
      }, {
        type: 'warning',
        text: 'I didn\'t find a database entry for "bar"',
        logPath,
        logRange: [[27, 0], [27, 49]]
      }]

      const result = parser.parse()

      expect(result).toEqual(expectedResult)
    })
  })
})
