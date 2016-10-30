/** @babel */

import './spec-helpers'
import Logger from '../lib/logger'

describe('Logger', () => {
  let logger

  beforeEach(() => {
    logger = new Logger()
  })

  describe('showMessage', () => {
    it('verifies that calling directly without preceding call to group automatically calls groupEnd', () => {
      spyOn(logger, 'groupEnd').andReturn()
      logger.showMessage({ type: 'error' })

      expect(logger.groupEnd).toHaveBeenCalled()
    })
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

      expect(logger.showMessages).toHaveBeenCalledWith('foo', [{ type: 'error' }, { type: 'info' }, { type: 'warning' }])
    })

    it('verifies info messages filtered when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'warning')
      logger.groupEnd()

      expect(logger.showMessages).toHaveBeenCalledWith('foo', [{ type: 'error' }, { type: 'warning' }])
    })

    it('verifies warning and info messages filtered when logging level set to error', () => {
      atom.config.set('latex.loggingLevel', 'error')
      logger.groupEnd()

      expect(logger.showMessages).toHaveBeenCalledWith('foo', [{ type: 'error' }])
    })
  })

  describe('getMostSevereType', () => {
    it('allows errors to override warnings and info messages', () => {
      const mostSevereType = Logger.getMostSevereType([{ type: 'info' }, { type: 'warning' }, { type: 'error' }])
      expect(mostSevereType).toBe('error')
    })

    it('allows warnings to override info messages', () => {
      const mostSevereType = Logger.getMostSevereType([{ type: 'info' }, { type: 'warning' }])
      expect(mostSevereType).toBe('warning')
    })
  })
})
