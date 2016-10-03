/** @babel */

import '../spec-bootstrap'
import DefaultLogger from '../../lib/loggers/default-logger'
import werkzeug from '../../lib/werkzeug'

describe('DefaultLogger', () => {
  let logger

  beforeEach(() => {
    logger = new DefaultLogger()
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
