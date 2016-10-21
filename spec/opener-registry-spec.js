/** @babel */

import helpers from './spec-helpers'

describe('OpenerRegistry', () => {
  const filePath = 'wibble.pdf'
  // The various viewers
  let cannotOpen, canOpen, canOpenInBackground, canOpenWithSynctex

  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
  })

  function createOpener (name, canOpen, hasSynctex, canOpenInBackground) {
    const instance = jasmine.createSpyObj(name, ['canOpen', 'open', 'hasSynctex', 'canOpenInBackground'])
    instance.canOpen.andReturn(canOpen)
    instance.hasSynctex.andReturn(hasSynctex)
    instance.canOpenInBackground.andReturn(canOpenInBackground)
    latex.opener.openers.set(name, instance)
    return instance
  }

  beforeEach(() => {
    latex.opener.openers.clear()
    // The opener names have to conform to latex.opener schema
    cannotOpen = createOpener('skim', false, true, true)
    canOpen = createOpener('xdg-open', true, false, false)
    canOpenInBackground = createOpener('okular', true, false, true)
    canOpenWithSynctex = createOpener('evince', true, true, false)
  })

  describe('open', () => {
    it('opens using preferred viewer even if it does not have requested features', () => {
      atom.config.set('latex.enableSynctex', true)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'xdg-open')

      latex.opener.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).toHaveBeenCalled()
      expect(canOpenInBackground.open).not.toHaveBeenCalled()
      expect(canOpenWithSynctex.open).not.toHaveBeenCalled()
    })

    it('opens viewer that supports SyncTeX when enabled', () => {
      atom.config.set('latex.enableSynctex', true)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'automatic')

      latex.opener.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).not.toHaveBeenCalled()
      expect(canOpenInBackground.open).not.toHaveBeenCalled()
      expect(canOpenWithSynctex.open).toHaveBeenCalled()
    })

    it('opens viewer that supports background opening when enabled', () => {
      atom.config.set('latex.enableSynctex', false)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'automatic')

      latex.opener.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).not.toHaveBeenCalled()
      expect(canOpenInBackground.open).toHaveBeenCalled()
      expect(canOpenWithSynctex.open).not.toHaveBeenCalled()
    })
  })
})
