/** @babel */

import _ from 'lodash'
import './spec-helpers'
import Logger from '../lib/logger'

describe('Logger', () => {
  let logger, counts

  beforeEach(() => {
    logger = new Logger()
  })

  describe('shouldShowMessage', () => {
    beforeEach(() => {
      logger.info()
      logger.warning()
      logger.error()
    })

    it('verifies no messages filtered when logging level set to info', () => {
      atom.config.set('latex.loggingLevel', 'info')
      counts = _.countBy(logger.getMessages(), 'type')

      expect(counts.error).toBeDefined()
      expect(counts.warning).toBeDefined()
      expect(counts.info).toBe(1)
    })

    it('verifies info messages filtered when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'warning')
      counts = _.countBy(logger.getMessages(), 'type')

      expect(counts.error).toBeDefined()
      expect(counts.warning).toBeDefined()
      expect(counts.info).toBeUndefined()
    })

    it('verifies warning and info messages filtered when logging level set to error', () => {
      atom.config.set('latex.loggingLevel', 'error')
      counts = _.countBy(logger.getMessages(), 'type')

      expect(counts.error).toBeDefined()
      expect(counts.warning).toBeUndefined()
      expect(counts.info).toBeUndefined()
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
