/** @babel */

import OpenerRegistry from '../lib/opener-registry'

describe('Latex', () => {
  const filePath = 'wibble.pdf'
  let registry
  // The various viewer
  let cannotOpen, canOpen, canOpenInBackground, canOpenWithSynctex

  function createOpener (name, canOpen, hasSynctex, canOpenInBackground) {
    const instance = jasmine.createSpyObj(name, ['canOpen', 'open', 'hasSynctex', 'canOpenInBackground'])
    instance.canOpen.andReturn(canOpen)
    instance.hasSynctex.andReturn(hasSynctex)
    instance.canOpenInBackground.andReturn(canOpenInBackground)
    registry.openers.set(name, instance)
    return instance
  }

  beforeEach(() => {
    registry = new OpenerRegistry()
    cannotOpen = createOpener('cannot-open', false, true, true)
    canOpen = createOpener('can-open', true, false, false)
    canOpenInBackground = createOpener('can-open-in-background', true, false, true)
    canOpenWithSynctex = createOpener('can-open-with-synctex', true, true, false)
  })

  describe('open', () => {
    it('opens using preferred viewer even if it does not have requested features', () => {
      atom.config.set('latex.enableSynctex', true)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'can-open')

      registry.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).toHaveBeenCalled()
      expect(canOpenInBackground.open).not.toHaveBeenCalled()
      expect(canOpenWithSynctex.open).not.toHaveBeenCalled()
    })

    it('opens viewer that supports SyncTeX when enabled', () => {
      atom.config.set('latex.enableSynctex', true)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'automatic')

      registry.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).not.toHaveBeenCalled()
      expect(canOpenInBackground.open).not.toHaveBeenCalled()
      expect(canOpenWithSynctex.open).toHaveBeenCalled()
    })

    it('opens viewer that supports background opening when enabled', () => {
      atom.config.set('latex.enableSynctex', false)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'automatic')

      registry.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).not.toHaveBeenCalled()
      expect(canOpenInBackground.open).toHaveBeenCalled()
      expect(canOpenWithSynctex.open).not.toHaveBeenCalled()
    })
  })
})
