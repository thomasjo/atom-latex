'use babel'

import helpers from './spec-helpers'
import path from 'path'
import BuilderRegistry from '../lib/builder-registry'

describe('BuilderRegistry', () => {
  let registry, fixturesPath, filePath

  beforeEach(() => {
    registry = new BuilderRegistry()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
  })

  describe('getBuilder', () => {
    beforeEach(() => {
      helpers.spyOnConfig('latex.builder', 'latexmk')
    })

    it('returns null when no builders are associated with the given file', () => {
      const filePath = path.join('foo', 'quux.txt')
      expect(registry.getBuilder(filePath)).toBeNull()
    })

    it('returns the configured builder when given a regular .tex file', () => {
      const filePath = path.join('foo', 'bar.tex')
      expect(registry.getBuilder(filePath).name).toEqual('LatexmkBuilder')

      helpers.spyOnConfig('latex.builder', 'texify')
      expect(registry.getBuilder(filePath).name).toEqual('TexifyBuilder')
    })

    it('throws an error when unable to resolve ambigious builder registration', () => {
      helpers.spyOnConfig('latex.builder', 'foo')
      expect(() => { registry.getBuilder(filePath) }).toThrow()
    })
  })
})
