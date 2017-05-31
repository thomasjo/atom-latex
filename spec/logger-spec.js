/** @babel */

import _ from 'lodash'
import './spec-helpers'
import Logger from '../lib/logger'

describe('Logger', () => {
  let logger, counts

  beforeEach(() => {
    logger = new Logger()
  })

  describe('getMessages', () => {
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
      expect(counts.info).toBeDefined()
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

    it('verifies no messages filtered when useFilters is false', () => {
      atom.config.set('latex.loggingLevel', 'error')
      counts = _.countBy(logger.getMessages(false), 'type')

      expect(counts.error).toBeDefined()
      expect(counts.warning).toBeDefined()
      expect(counts.info).toBeDefined()
    })
  })

  describe('isMessageTypeVisible', () => {
    it('verifies isMessageTypeVisible is true for all levels when logging level set to info', () => {
      atom.config.set('latex.loggingLevel', 'info')

      expect(logger.isMessageTypeVisible('info')).toBe(true)
      expect(logger.isMessageTypeVisible('warning')).toBe(true)
      expect(logger.isMessageTypeVisible('error')).toBe(true)
    })

    it('verifies isMessageTypeVisible is false for info when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'warning')

      expect(logger.isMessageTypeVisible('info')).toBe(false)
      expect(logger.isMessageTypeVisible('warning')).toBe(true)
      expect(logger.isMessageTypeVisible('error')).toBe(true)
    })

    it('verifies isMessageTypeVisible is false for info when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'error')

      expect(logger.isMessageTypeVisible('info')).toBe(false)
      expect(logger.isMessageTypeVisible('warning')).toBe(false)
      expect(logger.isMessageTypeVisible('error')).toBe(true)
    })
  })
})
