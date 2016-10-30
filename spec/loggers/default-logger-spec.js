/** @babel */

import DefaultLogger from '../../lib/loggers/default-logger'
import werkzeug from '../../lib/werkzeug'
import helpers from '../spec-helpers'

describe('DefaultLogger', () => {
  let logger

  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
    logger = new DefaultLogger()
  })

  describe('showErrorMarkersInEditor', () => {
    it('verifies that only messages that have a range and a matching file path are marked', () => {
      const editor = { getPath: () => 'foo.tex' }
      const messages = [{
        type: 'error',
        range: [[0, 0], [0, 1]],
        filePath: 'foo.tex'
      }, {
        type: 'warning',
        range: [[0, 0], [0, 1]],
        filePath: 'bar.tex'
      }, {
        type: 'info',
        filePath: 'foo.tex'
      }]
      spyOn(logger, 'addErrorMarker')

      logger.showErrorMarkersInEditor(editor, messages)

      expect(logger.addErrorMarker).toHaveBeenCalled()
    })
  })

  describe('sync', () => {
    it('silently does nothing when the current editor is transient', () => {
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath: null })
      spyOn(logger, 'show')
      spyOn(logger.logPanel, 'update')

      logger.sync()

      expect(logger.show).not.toHaveBeenCalled()
      expect(logger.logPanel.update).not.toHaveBeenCalled()
    })

    it('shows and updates the log panel with the file path and position', () => {
      const filePath = 'file.tex'
      const position = [[0, 0], [0, 10]]
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath, position })
      spyOn(logger, 'show')
      spyOn(logger.logPanel, 'update')

      logger.sync()

      expect(logger.show).toHaveBeenCalled()
      expect(logger.logPanel.update).toHaveBeenCalledWith({ filePath, position })
    })
  })
})
