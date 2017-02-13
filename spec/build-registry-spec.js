/* @flow */

import helpers from './spec-helpers'
import { NullBuilder } from './stubs'
import BuilderRegistry from '../lib/builder-registry'
import { BuildState } from '../lib/build-state'

describe('BuilderRegistry', () => {
  let builderRegistry

  beforeEach(() => {
    waitsForPromise(() => helpers.activatePackages())

    atom.config.set('latex.builder', 'latexmk')
    builderRegistry = new BuilderRegistry()
  })

  describe('getBuilderImplementation', () => {
    it('returns null when no builders are associated with the given file', () => {
      const state = new BuildState('quux.txt')
      expect(builderRegistry.getBuilderImplementation(state)).toBeNull()
    })

    it('returns the configured builder when given a regular .tex file', () => {
      const state = new BuildState('foo.tex')
      const BuilderImpl = builderRegistry.getBuilderImplementation(state)
      expect(BuilderImpl).not.toBeNull()
      if (BuilderImpl) {
        expect(BuilderImpl.name).toEqual('LatexmkBuilder')
      }
    })

    it('throws an error when unable to resolve ambiguous builder registration', () => {
      const allBuilders = builderRegistry.getAllBuilders().push(NullBuilder)
      const state = new BuildState('foo.tex')
      spyOn(builderRegistry, 'getAllBuilders').andReturn(allBuilders)
      expect(() => { builderRegistry.getBuilderImplementation(state) }).toThrow()
    })

    it('returns the Knitr builder when presented with an .Rnw file', () => {
      const state = new BuildState('bar.Rnw')
      const BuilderImpl = builderRegistry.getBuilderImplementation(state)
      expect(BuilderImpl).not.toBeNull()
      if (BuilderImpl) {
        expect(BuilderImpl.name).toEqual('KnitrBuilder')
      }
    })
  })

  describe('getBuilder', () => {
    beforeEach(() => {
      atom.config.set('latex.builder', 'latexmk')
    })

    it('returns null when passed an unhandled file type', () => {
      const state = new BuildState('quux.txt')
      expect(builderRegistry.getBuilder(state)).toBeNull()
    })

    it('returns a builder instance as configured for regular .tex files', () => {
      const state = new BuildState('foo.tex')
      const builder = builderRegistry.getBuilder(state)
      expect(builder).not.toBeNull()
      if (builder) {
        expect(builder.constructor.name).toEqual('LatexmkBuilder')
      }
    })

    it('returns a builder instance as configured for knitr files', () => {
      const state = new BuildState('bar.Rnw')
      const builder = builderRegistry.getBuilder(state)
      expect(builder).not.toBeNull()
      if (builder) {
        expect(builder.constructor.name).toEqual('KnitrBuilder')
      }
    })
  })
})
