'use babel'

import helpers from './spec-helpers'
import path from 'path'
import BuilderRegistry from '../lib/builder-registry'

describe('BuilderRegistry', () => {
  let fixturesPath, filePath

  beforeEach(() => {
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
  })

  describe('::getBuilder', () => {
    beforeEach(() => {
      helpers.spyOnConfig('latex.builder', 'latexmk')
    })

    it('returns null when no builders are associated with the given file', () => {
      const filePath = path.join('foo', 'quux.txt')
      expect(BuilderRegistry.getBuilder(filePath)).toBeNull()
    })

    it('returns the configured builder when given a regular .tex file', () => {
      const filePath = path.join('foo', 'bar.tex')
      expect(BuilderRegistry.getBuilder(filePath).name).toEqual('LatexmkBuilder')

      helpers.spyOnConfig('latex.builder', 'texify')
      expect(BuilderRegistry.getBuilder(filePath).name).toEqual('TexifyBuilder')
    })

    it('throws an error when unable to resolve ambigous builder registration', () => {
      helpers.spyOnConfig('latex.builder', 'foo')
      expect(() => { BuilderRegistry.getBuilder(filePath) }).toThrow()
    })
  })
})
