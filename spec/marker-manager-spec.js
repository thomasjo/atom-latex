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
    let editor, manager

    beforeEach(() => {
      editor = {
        getPath: () => 'foo.tex',
        onDidDestroy: () => { return { dispose: () => null } }
      }
      manager = new MarkerManager(editor)
      spyOn(manager, 'addMarker')
      spyOn(manager, 'clear')
    })

    it('verifies that only messages that have a range and a matching file path are marked', () => {
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

      manager.addMarkers(messages, false)

      expect(manager.addMarker).toHaveBeenCalledWith('error', 'foo.tex', [[0, 0], [0, 1]])
      expect(manager.addMarker.calls.length).toEqual(1)
      expect(manager.clear).not.toHaveBeenCalled()
    })

    it('verifies that clear is called when reset flag is set', () => {
      manager.addMarkers([], true)

      expect(manager.clear).toHaveBeenCalled()
    })
  })
})
