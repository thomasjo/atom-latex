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
      expect(latex.logger).toBeDefined()
      expect(latex.opener).toBeDefined()
      expect(latex.process).toBeDefined()
    })
  })

  describe('getDefaultLogger', () => {
    it('returns an instance of DefaultLogger', () => {
      const defaultLogger = latex.getDefaultLogger()

      expect(defaultLogger.constructor.name).toBe('DefaultLogger')
    })
  })

  describe('Logger proxy', () => {
    let logger

    beforeEach(() => {
      logger = jasmine.createSpyObj('MockLogger', ['error', 'warning', 'info'])
      latex.setLogger(logger)
      latex.createLogProxy()
    })

    it('correctly proxies error to error', () => {
      const statusCode = 0
      const result = { foo: 'bar' }
      const builder = { run () { return '' } }
      latex.log.error(statusCode, result, builder)

      expect(logger.error).toHaveBeenCalledWith(statusCode, result, builder)
    })

    it('correctly proxies warning to warning', () => {
      const message = 'foo'
      latex.log.warning(message)

      expect(logger.warning).toHaveBeenCalledWith(message)
    })

    it('correctly proxies info to info', () => {
      const message = 'foo'
      latex.log.info(message)

      expect(logger.info).toHaveBeenCalledWith(message)
    })
  })
})
