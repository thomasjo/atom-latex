/** @babel */

import helpers from './spec-helpers'
import path from 'path'
import { NullBuilder } from './stubs'

describe('BuilderRegistry', () => {
  let fixturesPath, filePath

  beforeEach(() => {
    waitsForPromise(() => helpers.activatePackages())
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')

    atom.config.set('latex.builder', 'latexmk')
  })

  describe('getBuilderImplementation', () => {
    it('returns null when no builders are associated with the given file', () => {
      const filePath = path.join('foo', 'quux.txt')
      expect(latex.builderRegistry.getBuilderImplementation(filePath)).toBeNull()
    })

    it('returns the configured builder when given a regular .tex file', () => {
      const filePath = path.join('foo', 'bar.tex')
      expect(latex.builderRegistry.getBuilderImplementation(filePath).name).toEqual('LatexmkBuilder')

      atom.config.set('latex.builder', 'texify')
      expect(latex.builderRegistry.getBuilderImplementation(filePath).name).toEqual('TexifyBuilder')
    })

    it('throws an error when unable to resolve ambiguous builder registration', () => {
      const allBuilders = latex.builderRegistry.getAllBuilders().push(NullBuilder)
      spyOn(latex.builderRegistry, 'getAllBuilders').andReturn(allBuilders)
      expect(() => { latex.builderRegistry.getBuilderImplementation(filePath) }).toThrow()
    })

    it('returns the overridden builder when given a .tex file with a magic comment', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'latex-builder.tex')
      expect(latex.builderRegistry.getBuilderImplementation(filePath).name).toEqual('TexifyBuilder')
    })

    it('returns the Knitr builder when presented with an .Rnw file', () => {
      const filePath = path.join('foo', 'bar.Rnw')
      expect(latex.builderRegistry.getBuilderImplementation(filePath).name).toEqual('KnitrBuilder')
    })
  })

  describe('getBuilder', () => {
    beforeEach(() => {
      atom.config.set('latex.builder', 'latexmk')
    })

    it('returns a builder instance as configured for regular .tex files', () => {
      const filePath = 'foo.tex'

      expect(latex.builderRegistry.getBuilder(filePath).constructor.name).toEqual('LatexmkBuilder')

      atom.config.set('latex.builder', 'texify')
      expect(latex.builderRegistry.getBuilder(filePath).constructor.name).toEqual('TexifyBuilder')
    })

    it('returns null when passed an unhandled file type', () => {
      const filePath = 'quux.txt'
      expect(latex.builderRegistry.getBuilder(filePath)).toBeNull()
    })
  })

  describe('getBuilderFromMagic', () => {
    it('detects builder magic and outputs builder', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'latex-builder.tex')
      expect(latex.builderRegistry.getBuilderFromMagic(filePath)).toEqual('texify')
    })
  })
})
