/** @babel */

import _ from 'lodash'
import './spec-helpers'
import Logger from '../lib/logger'
import werkzeug from '../lib/werkzeug'

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

  describe('messageTypeIsVisible', () => {
    it('verifies messageTypeIsVisible is true for all levels when logging level set to info', () => {
      atom.config.set('latex.loggingLevel', 'info')

      expect(logger.messageTypeIsVisible('info')).toBe(true)
      expect(logger.messageTypeIsVisible('warning')).toBe(true)
      expect(logger.messageTypeIsVisible('error')).toBe(true)
    })

    it('verifies messageTypeIsVisible is false for info when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'warning')

      expect(logger.messageTypeIsVisible('info')).toBe(false)
      expect(logger.messageTypeIsVisible('warning')).toBe(true)
      expect(logger.messageTypeIsVisible('error')).toBe(true)
    })

    it('verifies messageTypeIsVisible is false for info when logging level set to warning', () => {
      atom.config.set('latex.loggingLevel', 'error')

      expect(logger.messageTypeIsVisible('info')).toBe(false)
      expect(logger.messageTypeIsVisible('warning')).toBe(false)
      expect(logger.messageTypeIsVisible('error')).toBe(true)
    })
  })

  describe('sync', () => {
    let logDock

    function initializeSpies (filePath, position) {
      logDock = jasmine.createSpyObj('LogDock', ['update'])
      spyOn(logger, 'show').andCallFake(() => Promise.resolve(logDock))
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath, position })
    }

    it('silently does nothing when the current editor is transient', () => {
      initializeSpies(null, null)

      waitsForPromise(() => logger.sync())

      runs(() => {
        expect(logger.show).not.toHaveBeenCalled()
        expect(logDock.update).not.toHaveBeenCalled()
      })
    })

    it('shows and updates the log panel with the file path and position', () => {
      const filePath = 'file.tex'
      const position = [[0, 0], [0, 10]]

      initializeSpies(filePath, position)

      waitsForPromise(() => logger.sync())

      runs(() => {
        expect(logger.show).toHaveBeenCalled()
        expect(logDock.update).toHaveBeenCalledWith({ filePath, position })
      })
    })
  })
})
