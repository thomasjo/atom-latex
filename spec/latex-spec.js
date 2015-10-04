'use babel'

import './spec-helpers'
import Latex from '../lib/latex'
import {NullOpener} from './stubs'

describe('Latex', () => {
  let latex, globalLatex

  beforeEach(() => {
    globalLatex = global.latex
    delete global.latex
    latex = new Latex()
  })

  afterEach(() => {
    global.latex = globalLatex
  })

  describe('initialize', () => {
    it('initializes all properties', () => {
      spyOn(latex, 'resolveOpenerImplementation').andReturn(NullOpener)

      expect(latex.builder).toBeDefined()
      expect(latex.logger).toBeDefined()
      expect(latex.opener).toBeDefined()
    })
  })

  describe('getDefaultBuilder', () => {
    it('returns an instance of LatexmkBuilder by default', () => {
      spyOn(latex, 'useLatexmk').andReturn(true)
      const defaultBuilder = latex.getDefaultBuilder()
      expect(defaultBuilder.constructor.name).toBe('LatexmkBuilder')
    })

    it('returns an instance of TexifyBuilder when chosen', () => {
      spyOn(latex, 'useLatexmk').andReturn(false)
      const defaultBuilder = latex.getDefaultBuilder()
      expect(defaultBuilder.constructor.name).toBe('TexifyBuilder')
    })
  })

  describe('getDefaultLogger', () => {
    it('returns an instance of ConsoleLogger', () => {
      const defaultLogger = latex.getDefaultLogger()

      expect(defaultLogger.constructor.name).toBe('ConsoleLogger')
    })
  })

  describe('getDefaultOpener', () => {
    it('returns an instance of a resolved implementation of Opener', () => {
      spyOn(latex, 'resolveOpenerImplementation').andReturn(NullOpener)
      const defaultOpener = latex.getDefaultOpener()

      expect(defaultOpener.constructor.name).toBe(NullOpener.name)
    })
  })

  describe('Logger proxy', () => {
    let logger

    beforeEach(() => {
      logger = jasmine.createSpyObj('MockLogger', ['error', 'warning', 'info'])
      latex.setLogger(logger)
      latex.createLogProxy()
    })

    it('correctly proxies error to error', () => {
      const statusCode = 0
      const result = { foo: 'bar' }
      const builder = { run () { return '' } }
      latex.log.error(statusCode, result, builder)

      expect(logger.error).toHaveBeenCalledWith(statusCode, result, builder)
    })

    it('correctly proxies warning to warning', () => {
      const message = 'foo'
      latex.log.warning(message)

      expect(logger.warning).toHaveBeenCalledWith(message)
    })

    it('correctly proxies info to info', () => {
      const message = 'foo'
      latex.log.info(message)

      expect(logger.info).toHaveBeenCalledWith(message)
    })
  })

  describe('resolveOpenerImplementation', () => {
    it('returns SkimOpener when installed, and running on OS X', () => {
      spyOn(latex, 'skimExecutableExists').andReturn(true)
      const opener = latex.resolveOpenerImplementation('darwin')

      expect(opener.name).toBe('SkimOpener')
    })

    it('returns PreviewOpener when Skim is not installed, and running on OS X', () => {
      spyOn(latex, 'skimExecutableExists').andReturn(false)
      const opener = latex.resolveOpenerImplementation('darwin')

      expect(opener.name).toBe('PreviewOpener')
    })

    it('returns SumatraOpener when installed, and running on Windows', () => {
      spyOn(latex, 'sumatraExecutableExists').andReturn(true)
      const opener = latex.resolveOpenerImplementation('win32')

      expect(opener.name).toBe('SumatraOpener')
    })

    it('returns AtomPdfOpener as a fallback, if the pdf-view package is installed', () => {
      spyOn(latex, 'hasPdfViewerPackage').andReturn(true)
      const opener = latex.resolveOpenerImplementation('foo')

      expect(opener.name).toBe('AtomPdfOpener')
    })

    it('always returns AtomPdfOpener if alwaysOpenResultInAtom is enabled and pdf-view is installed', () => {
      spyOn(latex, 'hasPdfViewerPackage').andReturn(true)
      spyOn(latex, 'shouldOpenResultInAtom').andReturn(true)
      spyOn(latex, 'skimExecutableExists').andCallThrough()

      const opener = latex.resolveOpenerImplementation('darwin')

      expect(opener.name).toBe('AtomPdfOpener')
      expect(latex.skimExecutableExists).not.toHaveBeenCalled()
    })

    it('responds to changes in configuration', () => {
      spyOn(latex, 'hasPdfViewerPackage').andReturn(true)
      spyOn(latex, 'shouldOpenResultInAtom').andReturn(false)
      spyOn(latex, 'skimExecutableExists').andReturn(true)

      let opener = latex.resolveOpenerImplementation('darwin')
      expect(opener.name).toBe('SkimOpener')

      latex.shouldOpenResultInAtom.andReturn(true)
      opener = latex.resolveOpenerImplementation('darwin')
      expect(opener.name).toBe('AtomPdfOpener')

      latex.shouldOpenResultInAtom.andReturn(false)
      opener = latex.resolveOpenerImplementation('darwin')
      expect(opener.name).toBe('SkimOpener')
    })

    it('does not support GNU/Linux', () => {
      spyOn(latex, 'hasPdfViewerPackage').andReturn(false)
      const opener = latex.resolveOpenerImplementation('linux')

      expect(opener).toBeNull()
    })

    it('does not support unknown operating systems without pdf-view package', () => {
      spyOn(latex, 'hasPdfViewerPackage').andReturn(false)
      const opener = latex.resolveOpenerImplementation('foo')

      expect(opener).toBeNull()
    })

    it('returns CustomOpener when custom viewer exists and alwaysOpenResultInAtom is disabled', () => {
      spyOn(latex, 'viewerExecutableExists').andReturn(true)
      spyOn(latex, 'shouldOpenResultInAtom').andReturn(false)
      const opener = latex.resolveOpenerImplementation('foo')

      expect(opener.name).toBe('CustomOpener')
    })
  })
})
