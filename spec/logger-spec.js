/** @babel */

import './spec-helpers'
import Logger from '../lib/logger'
import werkzeug from '../lib/werkzeug'

describe('Logger', () => {
  let logger, messagesListener

  function initialize (loggingLevel = 'warning') {
    logger = new Logger()
    messagesListener = jasmine.createSpy('onMessagesListener')
    logger.onMessages(messagesListener)

    atom.config.set('latex.loggingLevel', loggingLevel)

    logger.info()
    logger.warning()
    logger.error()
  }

  describe('getMessages', () => {
    it('verifies no messages filtered when logging level set to info', () => {
      initialize('info')

      expect(logger.getMessages()).toEqual([{
        type: 'info'
      }, {
        type: 'warning'
      }, {
        type: 'error'
      }])
    })

    it('verifies info messages filtered when logging level set to warning', () => {
      initialize('warning')

      expect(logger.getMessages()).toEqual([{
        type: 'warning'
      }, {
        type: 'error'
      }])
    })

    it('verifies warning and info messages filtered when logging level set to error', () => {
      initialize('error')

      expect(logger.getMessages()).toEqual([{
        type: 'error'
      }])
    })

    it('verifies no messages filtered when useFilters is false', () => {
      initialize('error')

      expect(logger.getMessages(false)).toEqual([{
        type: 'info'
      }, {
        type: 'warning'
      }, {
        type: 'error'
      }])
    })
  })

  describe('messageTypeIsVisible', () => {
    it('verifies messageTypeIsVisible is true for all levels when logging level set to info', () => {
      initialize('info')

      expect(logger.messageTypeIsVisible('info')).toBe(true)
      expect(logger.messageTypeIsVisible('warning')).toBe(true)
      expect(logger.messageTypeIsVisible('error')).toBe(true)
    })

    it('verifies messageTypeIsVisible is false for info when logging level set to warning', () => {
      initialize('warning')

      expect(logger.messageTypeIsVisible('info')).toBe(false)
      expect(logger.messageTypeIsVisible('warning')).toBe(true)
      expect(logger.messageTypeIsVisible('error')).toBe(true)
    })

    it('verifies messageTypeIsVisible is false for info when logging level set to warning', () => {
      initialize('error')

      expect(logger.messageTypeIsVisible('info')).toBe(false)
      expect(logger.messageTypeIsVisible('warning')).toBe(false)
      expect(logger.messageTypeIsVisible('error')).toBe(true)
    })
  })

  describe('sync', () => {
    let logDock

    function initializeSpies (filePath, position) {
      initialize()
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

  describe('onMessages', () => {
    it('verifies no messages filtered when logging level set to info', () => {
      initialize('info')

      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'info' }],
        reset: false
      })
      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'warning' }],
        reset: false
      })
      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'error' }],
        reset: false
      })
    })

    it('verifies info messages filtered when logging level set to warning', () => {
      initialize('warning')

      expect(messagesListener).not.toHaveBeenCalledWith({
        messages: [{ type: 'info' }],
        reset: false
      })
      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'warning' }],
        reset: false
      })
      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'error' }],
        reset: false
      })
    })

    it('verifies warning and info messages filtered when logging level set to error', () => {
      initialize('error')

      expect(messagesListener).not.toHaveBeenCalledWith({
        messages: [{ type: 'info' }],
        reset: false
      })
      expect(messagesListener).not.toHaveBeenCalledWith({
        messages: [{ type: 'warning' }],
        reset: false
      })
      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'error' }],
        reset: false
      })
    })

    it('verifies a new message list is sent when the logging level is changed', () => {
      initialize('info')

      atom.config.set('latex.loggingLevel', 'error')

      expect(messagesListener).toHaveBeenCalledWith({
        messages: [{ type: 'error' }],
        reset: true
      })
    })
  })

  describe('setMessages', () => {
    it('replaces message list and sends reset signal when called', () => {
      const messages = [{ type: 'error', text: 'foo' }]

      initialize('info')
      logger.setMessages(messages)

      expect(messagesListener).toHaveBeenCalledWith({ messages, reset: true })
      expect(logger.getMessages(false)).toEqual(messages)
    })
  })

  describe('clear', () => {
    it('empties message list and sends reset signal when called', () => {
      initialize('info')
      logger.clear()

      expect(messagesListener).toHaveBeenCalledWith({ messages: [], reset: true })
      expect(logger.getMessages(false)).toEqual([])
    })
  })

  describe('refresh', () => {
    it('sends reset signal when called', () => {
      const messages = [{ type: 'error' }]

      initialize('error')
      logger.refresh()

      expect(messagesListener).toHaveBeenCalledWith({ messages, reset: true })
    })
  })
})
