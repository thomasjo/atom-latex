/** @babel */

import helpers from './spec-helpers'
import fs from 'fs-plus'
import path from 'path'
import werkzeug from '../lib/werkzeug'
import Composer from '../lib/composer'
import BuildState from '../lib/build-state'

describe('Composer', () => {
  beforeEach(() => {
    waitsForPromise(() => helpers.activatePackages())
  })

  describe('build', () => {
    let editor, builder, composer

    function initializeSpies (filePath, jobnames = [null], statusCode = 0) {
      editor = jasmine.createSpyObj('MockEditor', ['save', 'isModified'])
      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(state => {
        state.jobnames = jobnames
      })
      spyOn(werkzeug, 'getEditorDetails').andReturn({ editor, filePath })

      builder = jasmine.createSpyObj('MockBuilder', ['run', 'constructArgs', 'parseLogAndFdbFiles'])
      builder.run.andCallFake(() => {
        switch (statusCode) {
          case 0: { return Promise.resolve(statusCode) }
        }

        return Promise.reject(statusCode)
      })
      spyOn(latex.builderRegistry, 'getBuilder').andReturn(builder)
    }

    beforeEach(() => {
      composer = new Composer()
      spyOn(composer, 'showResult').andReturn()
      spyOn(composer, 'showError').andReturn()
    })

    it('does nothing for new, unsaved files', () => {
      initializeSpies(null)

      let result = 'aaaaaaaaaaaa'
      waitsForPromise(() => {
        return composer.build().then(r => { result = r })
      })

      runs(() => {
        expect(result).toBe(false)
        expect(composer.showResult).not.toHaveBeenCalled()
        expect(composer.showError).not.toHaveBeenCalled()
      })
    })

    it('does nothing for unsupported file extensions', () => {
      initializeSpies('foo.bar')
      latex.builderRegistry.getBuilder.andReturn(null)

      let result
      waitsForPromise(() => {
        return composer.build().then(r => { result = r })
      })

      runs(() => {
        expect(result).toBe(false)
        expect(composer.showResult).not.toHaveBeenCalled()
        expect(composer.showError).not.toHaveBeenCalled()
      })
    })

    it('saves the file before building, if modified', () => {
      initializeSpies('file.tex')
      editor.isModified.andReturn(true)

      builder.parseLogAndFdbFiles.andReturn({
        outputFilePath: 'file.pdf',
        messages: []
      })

      waitsForPromise(() => {
        return composer.build()
      })

      runs(() => {
        expect(editor.isModified).toHaveBeenCalled()
        expect(editor.save).toHaveBeenCalled()
      })
    })

    it('runs the build two times with multiple job names', () => {
      initializeSpies('file.tex', ['foo', 'bar'])

      builder.parseLogAndFdbFiles.andReturn({
        outputFilePath: 'file.pdf',
        messages: []
      })

      waitsForPromise(() => {
        return composer.build()
      })

      runs(() => {
        expect(builder.run.callCount).toBe(2)
      })
    })

    it('invokes `showResult` after a successful build, with expected log parsing result', () => {
      const result = {
        outputFilePath: 'file.pdf',
        messages: []
      }

      initializeSpies('file.tex')
      builder.parseLogAndFdbFiles.andReturn(result)

      waitsForPromise(() => {
        return composer.build()
      })

      runs(() => {
        expect(composer.showResult).toHaveBeenCalledWith(result)
      })
    })

    it('treats missing output file data in log file as an error', () => {
      initializeSpies('file.tex')

      builder.parseLogAndFdbFiles.andReturn({
        outputFilePath: null,
        messages: []
      })

      waitsForPromise(() => {
        return composer.build().catch(r => r)
      })

      runs(() => {
        expect(composer.showError).toHaveBeenCalled()
      })
    })

    it('treats missing result from parser as an error', () => {
      initializeSpies('file.tex')
      builder.parseLogAndFdbFiles.andReturn(null)

      waitsForPromise(() => {
        return composer.build().catch(r => r)
      })

      runs(() => {
        expect(composer.showError).toHaveBeenCalled()
      })
    })

    it('handles active item not being a text editor', () => {
      spyOn(atom.workspace, 'getActiveTextEditor').andReturn()
      spyOn(werkzeug, 'getEditorDetails').andCallThrough()

      waitsForPromise(() => {
        return composer.build().catch(r => r)
      })

      runs(() => {
        expect(werkzeug.getEditorDetails).toHaveBeenCalled()
      })
    })
  })

  describe('clean', () => {
    let fixturesPath, composer

    function initializeSpies (filePath, jobnames = [null]) {
      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(state => {
        state.jobnames = jobnames
      })
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath })
      spyOn(composer, 'getGeneratedFileList').andCallFake((builder, state) => {
        let { dir, name } = path.parse(state.filePath)
        if (state.outputDirectory) {
          dir = path.resolve(dir, state.outputDirectory)
        }
        if (state.jobname) name = state.jobname
        return new Set([
          path.format({ dir, name, ext: '.log' }),
          path.format({ dir, name, ext: '.aux' })
        ])
      })
    }

    beforeEach(() => {
      composer = new Composer()
      fixturesPath = helpers.cloneFixtures()
      spyOn(fs, 'removeSync').andCallThrough()
      atom.config.set('latex.cleanPatterns', ['**/*.aux', '/_minted-{jobname}'])
    })

    it('deletes aux file but leaves log file when log file is not in cleanPatterns', () => {
      initializeSpies(path.join(fixturesPath, 'foo.tex'))

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(fixturesPath, 'foo.aux'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, '_minted-foo'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, 'foo.log'))
      })
    })

    it('deletes aux file but leaves log file when log file is not in cleanPatterns with output directory', () => {
      const outdir = 'build'
      atom.config.set('latex.outputDirectory', outdir)
      initializeSpies(path.join(fixturesPath, 'foo.tex'))

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(fixturesPath, outdir, 'foo.aux'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, '_minted-foo'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, outdir, 'foo.log'))
      })
    })

    it('deletes aux file but leaves log file when log file is not in cleanPatterns with relative output directory', () => {
      const outdir = path.join('..', 'build')
      atom.config.set('latex.outputDirectory', outdir)
      initializeSpies(path.join(fixturesPath, 'foo.tex'))

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(fixturesPath, outdir, 'foo.aux'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, '_minted-foo'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, outdir, 'foo.log'))
      })
    })

    it('deletes aux file but leaves log file when log file is not in cleanPatterns with absolute output directory', () => {
      const outdir = process.platform === 'win32' ? 'c:\\build' : '/build'
      atom.config.set('latex.outputDirectory', outdir)
      initializeSpies(path.join(fixturesPath, 'foo.tex'))

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(outdir, 'foo.aux'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, '_minted-foo'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(outdir, 'foo.log'))
      })
    })

    it('deletes aux files but leaves log files when log file is not in cleanPatterns with jobnames', () => {
      initializeSpies(path.join(fixturesPath, 'foo.tex'), ['bar', 'wibble'])

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(fixturesPath, 'bar.aux'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, 'bar.log'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, '_minted-bar'))
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(fixturesPath, 'wibble.aux'))
        expect(fs.removeSync).not.toHaveBeenCalledWith(path.join(fixturesPath, 'wibble.log'))
        expect(fs.removeSync).toHaveBeenCalledWith(path.join(fixturesPath, '_minted-wibble'))
      })
    })

    it('stops immediately if the file is not a TeX document', () => {
      const filePath = 'foo.bar'
      initializeSpies(filePath, [])

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(fs.removeSync).not.toHaveBeenCalled()
      })
    })
  })

  describe('shouldMoveResult', () => {
    let composer, state
    const rootFilePath = '/wibble/gronk.tex'

    function initializeSpies (outputDirectory = '') {
      composer = new Composer()
      state = new BuildState(rootFilePath)
      state.outputDirectory = outputDirectory
    }

    it('should return false when using neither an output directory, nor the move option', () => {
      initializeSpies()
      atom.config.set('latex.moveResultToSourceDirectory', false)

      expect(composer.shouldMoveResult(state)).toBe(false)
    })

    it('should return false when not using an output directory, but using the move option', () => {
      initializeSpies()
      atom.config.set('latex.moveResultToSourceDirectory', true)

      expect(composer.shouldMoveResult(state)).toBe(false)
    })

    it('should return false when not using the move option, but using an output directory', () => {
      initializeSpies('baz')
      atom.config.set('latex.moveResultToSourceDirectory', false)

      expect(composer.shouldMoveResult(state)).toBe(false)
    })

    it('should return true when using both an output directory and the move option', () => {
      initializeSpies('baz')
      atom.config.set('latex.moveResultToSourceDirectory', true)

      expect(composer.shouldMoveResult(state)).toBe(true)
    })
  })

  describe('sync', () => {
    let composer

    beforeEach(() => {
      composer = new Composer()
    })

    it('silently does nothing when the current editor is transient', () => {
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath: null })
      spyOn(composer, 'resolveOutputFilePath').andCallThrough()
      spyOn(latex.opener, 'open').andReturn(true)

      waitsForPromise(() => composer.sync())

      runs(() => {
        expect(composer.resolveOutputFilePath).not.toHaveBeenCalled()
        expect(latex.opener.open).not.toHaveBeenCalled()
      })
    })

    it('logs a warning and returns when an output file cannot be resolved', () => {
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath: 'file.tex', lineNumber: 1 })
      spyOn(composer, 'resolveOutputFilePath').andReturn()
      spyOn(latex.opener, 'open').andReturn(true)
      spyOn(latex.log, 'warning').andCallThrough()

      waitsForPromise(() => composer.sync())

      runs(() => {
        expect(latex.log.warning).toHaveBeenCalled()
        expect(latex.opener.open).not.toHaveBeenCalled()
      })
    })

    it('launches the opener using editor metadata and resolved output file', () => {
      const filePath = 'file.tex'
      const lineNumber = 1
      const outputFilePath = 'file.pdf'
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath, lineNumber })
      spyOn(composer, 'resolveOutputFilePath').andReturn(outputFilePath)

      spyOn(latex.opener, 'open').andReturn(true)

      waitsForPromise(() => composer.sync())

      runs(() => {
        expect(latex.opener.open).toHaveBeenCalledWith(outputFilePath, filePath, lineNumber)
      })
    })

    it('launches the opener using editor metadata and resolved output file with jobnames', () => {
      const filePath = 'file.tex'
      const lineNumber = 1
      const jobnames = ['foo', 'bar']

      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath, lineNumber })
      spyOn(composer, 'resolveOutputFilePath').andCallFake((builder, state) => state.jobname + '.pdf')
      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(state => {
        state.jobnames = jobnames
      })
      // spyOn(composer, 'initializeBuild').andReturn({ rootFilePath, builder, jobnames })

      spyOn(latex.opener, 'open').andReturn(true)

      waitsForPromise(() => composer.sync())

      runs(() => {
        expect(latex.opener.open).toHaveBeenCalledWith('foo.pdf', filePath, lineNumber)
        expect(latex.opener.open).toHaveBeenCalledWith('bar.pdf', filePath, lineNumber)
      })
    })
  })

  describe('moveResult', () => {
    let composer
    const texFilePath = path.normalize('/angle/gronk.tex')
    const outputFilePath = path.normalize('/angle/dangle/gronk.pdf')
    const result = { outputFilePath }

    beforeEach(() => {
      composer = new Composer()
      spyOn(fs, 'removeSync')
      spyOn(fs, 'moveSync')
    })

    it('verifies that the output file and the synctex file are moved when they exist', () => {
      const destOutputFilePath = path.normalize('/angle/gronk.pdf')
      const syncTexPath = path.normalize('/angle/dangle/gronk.synctex.gz')
      const destSyncTexPath = path.normalize('/angle/gronk.synctex.gz')

      spyOn(fs, 'existsSync').andReturn(true)

      composer.moveResult(result, texFilePath)
      expect(fs.removeSync).toHaveBeenCalledWith(destOutputFilePath)
      expect(fs.removeSync).toHaveBeenCalledWith(destSyncTexPath)
      expect(fs.moveSync).toHaveBeenCalledWith(outputFilePath, destOutputFilePath)
      expect(fs.moveSync).toHaveBeenCalledWith(syncTexPath, destSyncTexPath)
    })

    it('verifies that the output file and the synctex file are not moved when they do not exist', () => {
      spyOn(fs, 'existsSync').andReturn(false)

      composer.moveResult(result, texFilePath)
      expect(fs.removeSync).not.toHaveBeenCalled()
      expect(fs.removeSync).not.toHaveBeenCalled()
      expect(fs.moveSync).not.toHaveBeenCalled()
      expect(fs.moveSync).not.toHaveBeenCalled()
    })
  })

  describe('initializeBuildStateFromMagic', () => {
    it('detects magic and overrides build state values', () => {
      const filePath = path.join(__dirname, 'fixtures', 'magic-comments', 'override-settings.tex')
      const state = new BuildState(filePath)
      const composer = new Composer()

      composer.initializeBuildStateFromMagic(state)

      expect(state.outputDirectory).toEqual('wibble')
      expect(state.outputFormat).toEqual('ps')
      expect(state.producer).toEqual('xdvipdfmx')
      expect(state.engine).toEqual('lualatex')
      expect(state.jobnames).toEqual(['foo', 'bar'])
    })
  })
})
