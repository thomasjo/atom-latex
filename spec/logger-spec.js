/** @babel */

import './spec-helpers'
import Logger from '../lib/logger'

describe('Logger', () => {
  let logger

  beforeEach(() => {
    logger = new Logger()
  })

  describe('showFilteredMessages', () => {
    beforeEach(() => {
      spyOn(logger, 'showMessages').andReturn()
      logger.group('foo')
      logger.info()
      logger.warning()
      logger.error()
    })

    it('verifies no messages filtered when logging level set to info', () => {
      atom.config.set('latex.loggingLevel', 'info')
      logger.groupEnd()

      expect(logger.showMessages).toHaveBeenCalledWith('foo', [{ type: 'Error' }, { type: 'Info' }, { type: 'Warning' }])
    })

    it('verifies info messages filtered when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'warning')
      logger.groupEnd()

      expect(logger.showMessages).toHaveBeenCalledWith('foo', [{ type: 'Error' }, { type: 'Warning' }])
    })

    it('verifies warning and info messages filtered when logging level set to error', () => {
      atom.config.set('latex.loggingLevel', 'error')
      logger.groupEnd()

      expect(logger.showMessages).toHaveBeenCalledWith('foo', [{ type: 'Error' }])
    })
  })

  describe('getMostSevereType', () => {
    it('allows errors to override warnings and info messages', () => {
      const mostSevereType = Logger.getMostSevereType([{ type: 'Info' }, { type: 'Warning' }, { type: 'Error' }])
      expect(mostSevereType).toBe('Error')
    })

    it('allows warnings to override info messages', () => {
      const mostSevereType = Logger.getMostSevereType([{ type: 'Info' }, { type: 'Warning' }])
      expect(mostSevereType).toBe('Warning')
    })
  })
})
