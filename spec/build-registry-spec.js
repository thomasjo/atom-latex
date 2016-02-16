'use babel'

import helpers from './spec-helpers'
import path from 'path'
import BuilderRegistry from '../lib/builder-registry'
import {NullBuilder} from './stubs'

describe('BuilderRegistry', () => {
  let registry, fixturesPath, filePath

  beforeEach(() => {
    registry = new BuilderRegistry()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
  })

  describe('getBuilder', () => {
    beforeEach(() => {
      atom.config.set('latex.builder', 'latexmk')
    })

    it('returns null when no builders are associated with the given file', () => {
      const filePath = path.join('foo', 'quux.txt')
      expect(registry.getBuilder(filePath)).toBeNull()
    })

    it('returns the configured builder when given a regular .tex file', () => {
      const filePath = path.join('foo', 'bar.tex')
      expect(registry.getBuilder(filePath).name).toEqual('LatexmkBuilder')

      atom.config.set('latex.builder', 'texify')
      expect(registry.getBuilder(filePath).name).toEqual('TexifyBuilder')
    })

    it('throws an error when unable to resolve ambigious builder registration', () => {
      const allBuilders = registry.getAllBuilders().push(NullBuilder)
      spyOn(registry, 'getAllBuilders').andReturn(allBuilders)
      expect(() => { registry.getBuilder(filePath) }).toThrow()
    })
  })
})
