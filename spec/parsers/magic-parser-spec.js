'use babel'

import path from 'path'
import MagicParser from '../../lib/parsers/magic-parser'

describe('MagicParser', () => {
  let fixturesPath

  beforeEach(() => {
    fixturesPath = atom.project.getPaths()[0]
  })

  describe('parse', () => {
    it('returns an empty object when file contains no magic comments', () => {
      const filePath = path.join(fixturesPath, 'file.tex')
      const parser = new MagicParser(filePath)
      const result = parser.parse()

      expect(result).toEqual({})
    })

    it('returns path to root file when file contains magic root comment', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'root-comment.tex')
      const parser = new MagicParser(filePath)
      const result = parser.parse()

      expect(result).toEqual({
        'root': '../file.tex'
      })
    })

    it('returns path to root file when file contains magic root comment when magic comment is not on the first line', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'not-first-line.tex')
      const parser = new MagicParser(filePath)
      const result = parser.parse()

      expect(result).toEqual({
        'root': '../file.tex'
      })
    })

    it('handles magic comments without optional whitespace', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'no-whitespace.tex')
      const parser = new MagicParser(filePath)
      const result = parser.parse()

      expect(result).not.toEqual({})
    })
    it('detects multiple object information when multiple magice comments are defined', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'multiple-magic-comments.tex')
      const parser = new MagicParser(filePath)
      const result = parser.parse()

      expect(result).toEqual({
        'root': '../file.tex',
        'program': 'pdflatex'
      })
    })
  })
})
