path = require 'path'
MagicParser = require '../../lib/parsers/magic-parser'

describe "MagicParser", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = atom.project.getPath()

  describe "parse", ->
    it "returns an empty object when file contains no magic comments", ->
      filePath = path.join(fixturesPath, 'file.tex')
      parser = new MagicParser(filePath)
      result = parser.parse()

      expect(result).toEqual {}

    it "returns path to root file when file contains magic root comment", ->
      filePath = path.join(fixturesPath, 'magic-comments', 'root-comment.tex')
      parser = new MagicParser(filePath)
      result = parser.parse()

      expect(result).toEqual {
        'root': '../file.tex'
      }

    it "returns an empty object when magic comment is not on the first line", ->
      filePath = path.join(fixturesPath, 'magic-comments', 'not-first-line.tex')
      parser = new MagicParser(filePath)
      result = parser.parse()

      expect(result).toEqual {}

    it "handles magic comments without optional whitespace", ->
      filePath = path.join(fixturesPath, 'magic-comments', 'no-whitespace.tex')
      parser = new MagicParser(filePath)
      result = parser.parse()

      expect(result).not.toEqual {}
