'use babel'

import helpers from './spec-helpers'
import path from 'path'
import Builder from '../lib/builder'

describe('Builder', () => {
  let builder, fixturesPath, filePath, logFilePath

  beforeEach(() => {
    builder = new Builder()
    fixturesPath = helpers.cloneFixtures()
    filePath = path.join(fixturesPath, 'file.tex')
    logFilePath = path.join(fixturesPath, 'file.log')
  })

  describe('constructPath', () => {
    it('reads `latex.texPath` as configured', () => {
      spyOn(atom.config, 'get').andReturn()
      builder.constructPath()

      expect(atom.config.get).toHaveBeenCalledWith('latex.texPath')
    })

    it('uses platform default when `latex.texPath` is not configured', () => {
      const defaultTexPath = '/foo/bar'
      const expectedPath = [defaultTexPath, process.env.PATH].join(path.delimiter)
      helpers.spyOnConfig('latex.texPath', '')
      spyOn(builder, 'defaultTexPath').andReturn(defaultTexPath)

      const constructedPath = builder.constructPath()

      expect(constructedPath).toBe(expectedPath)
    })

    it('replaces surrounded $PATH with process.env.PATH', () => {
      const texPath = '/foo:$PATH:/bar'
      const expectedPath = texPath.replace('$PATH', process.env.PATH)
      helpers.spyOnConfig('latex.texPath', texPath)

      const constructedPath = builder.constructPath()

      expect(constructedPath).toBe(expectedPath)
    })

    it('replaces leading $PATH with process.env.PATH', () => {
      const texPath = '$PATH:/bar'
      const expectedPath = texPath.replace('$PATH', process.env.PATH)
      helpers.spyOnConfig('latex.texPath', texPath)

      const constructedPath = builder.constructPath()

      expect(constructedPath).toBe(expectedPath)
    })

    it('replaces trailing $PATH with process.env.PATH', () => {
      const texPath = '/foo:$PATH'
      const expectedPath = texPath.replace('$PATH', process.env.PATH)
      helpers.spyOnConfig('latex.texPath', texPath)

      const constructedPath = builder.constructPath()

      expect(constructedPath).toBe(expectedPath)
    })

    it('prepends process.env.PATH with texPath', () => {
      const texPath = '/foo'
      const expectedPath = [texPath, process.env.PATH].join(path.delimiter)
      helpers.spyOnConfig('latex.texPath', texPath)

      const constructedPath = builder.constructPath()

      expect(constructedPath).toBe(expectedPath)
    })
  })

  describe('parseLogFile', () => {
    let logParser

    beforeEach(() => {
      logParser = jasmine.createSpyObj('MockLogParser', ['parse'])
      spyOn(builder, 'getLogParser').andReturn(logParser)
    })

    it('resolves the associated log file path by invoking @resolveLogFilePath', () => {
      spyOn(builder, 'resolveLogFilePath').andReturn('foo.log')
      builder.parseLogFile(filePath)

      expect(builder.resolveLogFilePath).toHaveBeenCalledWith(filePath)
    })

    it('returns null if passed a file path that does not exist', () => {
      filePath = '/foo/bar/quux.tex'
      const result = builder.parseLogFile(filePath)

      expect(result).toBeNull()
      expect(logParser.parse).not.toHaveBeenCalled()
    })

    it('attempts to parse the resolved log file', () => {
      builder.parseLogFile(filePath)

      expect(builder.getLogParser).toHaveBeenCalledWith(logFilePath)
      expect(logParser.parse).toHaveBeenCalled()
    })
  })

  describe('getLatexEngineFromMagic', () => {
    it('detects program magic and outputs correct engine', () => {
      const filePath = path.join(fixturesPath, 'magic-comments', 'latex-engine.tex')
      expect(builder.getLatexEngineFromMagic(filePath)).toEqual('pdflatex')
    })
  })
})
