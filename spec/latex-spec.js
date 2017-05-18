/** @babel */

import helpers from './spec-helpers'

describe('Latex', () => {
  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
  })

  describe('initialize', () => {
    it('initializes all properties', () => {
      expect(latex.log).toBeDefined()
      expect(latex.opener).toBeDefined()
      expect(latex.process).toBeDefined()
    })
  })
})
