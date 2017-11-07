/** @babel */

// eslint-disable-next-line no-unused-vars
import { afterEach, beforeEach, it, fit } from './async-spec-helpers'
import { activatePackages } from './spec-helpers'

describe('OpenerRegistry', () => {
  const filePath = 'wibble.pdf'
  // The various viewers
  let cannotOpen, canOpen, canOpenInBackground, canOpenWithSynctex

  beforeEach(async () => {
    await activatePackages()
  })

  function createOpener (name, canOpen, hasSynctex, canOpenInBackground) {
    const opener = jasmine.createSpyObj(name, [
      'open',
      'canOpen',
      'hasSynctex',
      'canOpenInBackground'
    ])

    opener.open.andCallFake(() => Promise.resolve())
    opener.canOpen.andReturn(canOpen)
    opener.hasSynctex.andReturn(hasSynctex)
    opener.canOpenInBackground.andReturn(canOpenInBackground)

    latex.opener.openers.set(name, opener)

    return opener
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
    it('opens using preferred viewer even if it does not have requested features', async () => {
      atom.config.set('latex.enableSynctex', true)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'xdg-open')

      await latex.opener.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).toHaveBeenCalled()
      expect(canOpenInBackground.open).not.toHaveBeenCalled()
      expect(canOpenWithSynctex.open).not.toHaveBeenCalled()
    })

    it('opens viewer that supports SyncTeX when enabled', async () => {
      atom.config.set('latex.enableSynctex', true)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'automatic')

      await latex.opener.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).not.toHaveBeenCalled()
      expect(canOpenInBackground.open).not.toHaveBeenCalled()
      expect(canOpenWithSynctex.open).toHaveBeenCalled()
    })

    it('opens viewer that supports background opening when enabled', async () => {
      atom.config.set('latex.enableSynctex', false)
      atom.config.set('latex.openResultInBackground', true)
      atom.config.set('latex.opener', 'automatic')

      await latex.opener.open(filePath)

      expect(cannotOpen.open).not.toHaveBeenCalled()
      expect(canOpen.open).not.toHaveBeenCalled()
      expect(canOpenInBackground.open).toHaveBeenCalled()
      expect(canOpenWithSynctex.open).not.toHaveBeenCalled()
    })
  })
})
