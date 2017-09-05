/** @babel */

import helpers from './spec-helpers'
import { NullBuilder } from './stubs'
import BuilderRegistry from '../lib/builder-registry'
import BuildState from '../lib/build-state'

describe('BuilderRegistry', () => {
  let builderRegistry

  beforeEach(() => {
    waitsForPromise(() => helpers.activatePackages())

    builderRegistry = new BuilderRegistry()
  })

  describe('getBuilderImplementation', () => {
    it('returns null when no builders are associated with the given file', () => {
      const state = new BuildState('quux.txt')
      expect(builderRegistry.getBuilderImplementation(state)).toBeNull()
    })

    it('returns null when passed a Pweave file', () => {
      const state = new BuildState('foo.Pnw')
      expect(builderRegistry.getBuilderImplementation(state)).toBeNull()
    })

    it('returns the configured builder when given a regular .tex file', () => {
      const state = new BuildState('foo.tex')
      expect(builderRegistry.getBuilderImplementation(state).name).toEqual('LatexmkBuilder')
    })

    it('returns the configured builder when given a literate Haskell file', () => {
      const state = new BuildState('foo.lhs')
      expect(builderRegistry.getBuilderImplementation(state).name).toEqual('LatexmkBuilder')
    })

    it('returns the configured builder when given a literate Agda file', () => {
      const state = new BuildState('foo.lagda')
      expect(builderRegistry.getBuilderImplementation(state).name).toEqual('LatexmkBuilder')
    })

    it('throws an error when unable to resolve ambiguous builder registration', () => {
      const allBuilders = builderRegistry.getAllBuilders().push(NullBuilder)
      const state = new BuildState('foo.tex')
      spyOn(builderRegistry, 'getAllBuilders').andReturn(allBuilders)
      expect(() => { builderRegistry.getBuilderImplementation(state) }).toThrow()
    })

    it('returns the Knitr builder when presented with an .Rnw file', () => {
      const state = new BuildState('bar.Rnw')
      expect(builderRegistry.getBuilderImplementation(state).name).toEqual('KnitrBuilder')
    })
  })

  describe('getBuilder', () => {
    it('returns null when passed an unhandled file type', () => {
      const state = new BuildState('quux.txt')
      expect(builderRegistry.getBuilder(state)).toBeNull()
    })

    it('returns a builder instance as configured for regular .tex files', () => {
      const state = new BuildState('foo.tex')
      expect(builderRegistry.getBuilder(state).constructor.name).toEqual('LatexmkBuilder')
    })

    it('returns a builder instance as configured for knitr files', () => {
      const state = new BuildState('bar.Rnw')
      expect(builderRegistry.getBuilder(state).constructor.name).toEqual('KnitrBuilder')
    })

    it('returns a builder instance as configured for literate Haskell files', () => {
      const state = new BuildState('foo.lhs')
      expect(builderRegistry.getBuilder(state).constructor.name).toEqual('LatexmkBuilder')
    })

    it('returns a builder instance as configured for literate Agda files', () => {
      const state = new BuildState('foo.lagda')
      expect(builderRegistry.getBuilder(state).constructor.name).toEqual('LatexmkBuilder')
    })

    it('returns null when passed an Pweave file', () => {
      const state = new BuildState('foo.Pnw')
      expect(builderRegistry.getBuilder(state)).toBeNull()
    })
  })
})
