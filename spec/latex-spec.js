/** @babel */

// eslint-disable-next-line no-unused-vars
import { afterEach, beforeEach, it, fit } from './async-spec-helpers'
import { activatePackages } from './spec-helpers'

describe('Latex', () => {
  beforeEach(async () => {
    await activatePackages()
  })

  describe('initialize', () => {
    it('initializes all properties', () => {
      expect(latex.log).toBeDefined()
      expect(latex.opener).toBeDefined()
      expect(latex.process).toBeDefined()
    })
  })
})
