/** @babel */

import helpers from './spec-helpers'
import MarkerManager from '../lib/marker-manager'

describe('MarkerManager', () => {
  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
  })

  describe('addMarkers', () => {
    it('verifies that only messages that have a range and a matching file path are marked', () => {
      const editor = {
        getPath: () => 'foo.tex',
        onDidDestroy: () => { return { dispose: () => null } }
      }
      const manager = new MarkerManager(editor)
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
      spyOn(manager, 'addMarker')

      manager.addMarkers(messages, false)

      expect(manager.addMarker).toHaveBeenCalledWith('error', 'foo.tex', [[0, 0], [0, 1]])
      expect(manager.addMarker.calls.length).toEqual(1)
    })
  })
})
