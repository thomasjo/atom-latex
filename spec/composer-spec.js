/** @babel */

import './spec-bootstrap'
import fs from 'fs-plus'
import path from 'path'
import Composer from '../lib/composer'
import werkzeug from '../lib/werkzeug'

describe('Composer', () => {
  let composer

  beforeEach(() => {
    atom.config.set('latex.builder', 'latexmk')
    composer = new Composer()
  })

  describe('build', () => {
    let editor, builder

    function initializeSpies (filePath, jobnames = [null], statusCode = 0) {
      editor = jasmine.createSpyObj('MockEditor', ['save', 'isModified'])
      spyOn(composer, 'resolveRootFilePath').andReturn(filePath)
      spyOn(werkzeug, 'getEditorDetails').andReturn({ editor, filePath })

      builder = jasmine.createSpyObj('MockBuilder', ['run', 'constructArgs', 'parseLogAndFdbFiles', 'getJobNamesFromMagic'])
      builder.getJobNamesFromMagic.andReturn(jobnames)
      builder.run.andCallFake(() => {
        switch (statusCode) {
          case 0: { return Promise.resolve(statusCode) }
        }

        return Promise.reject(statusCode)
      })
      spyOn(composer, 'getBuilder').andReturn(builder)
    }

    beforeEach(() => {
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
      composer.getBuilder.andReturn(null)

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
    function initializeSpies (filePath, jobnames = [null]) {
      const builder = jasmine.createSpyObj('MockBuilder', ['parseFdbFile', 'getJobNamesFromMagic'])

      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath })
      spyOn(composer, 'resolveRootFilePath').andReturn(filePath)
      spyOn(composer, 'initializeBuild').andReturn({ rootFilePath: filePath, builder, jobnames })
      spyOn(composer, 'getGeneratedFileList').andCallFake((builder, rootFilePath, jobname) => {
        let { dir, name } = path.parse(rootFilePath)
        if (jobname) name = jobname
        return [
          path.format({ dir, name, ext: '.log' }),
          path.format({ dir, name, ext: '.aux' })
        ]
      })
    }

    beforeEach(() => {
      spyOn(fs, 'removeSync').andCallThrough()
      atom.config.set('latex.cleanPatterns', ['**/*.aux', '/minted-{name}'])
    })

    it('deletes aux file but leaves log file when log file is not in cleanPatterns', () => {
      initializeSpies('/a/foo.tex')
      composer.clean()
      expect(fs.removeSync).toHaveBeenCalledWith('/a/foo.aux')
    })

    it('deletes aux files but leaves log files when log file is not in cleanPatterns with jobnames', () => {
      initializeSpies('/a/foo.tex', ['bar', 'wibble'])
      composer.clean()
      expect(fs.removeSync).toHaveBeenCalledWith('/a/bar.aux')
      expect(fs.removeSync).toHaveBeenCalledWith('/a/wibble.aux')
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
    it('should return false when using neither an output directory, nor the move option', () => {
      atom.config.set('latex.outputDirectory', '')
      atom.config.set('latex.moveResultToSourceDirectory', false)

      expect(composer.shouldMoveResult()).toBe(false)
    })

    it('should return false when not using an output directory, but using the move option', () => {
      atom.config.set('latex.outputDirectory', '')
      atom.config.set('latex.moveResultToSourceDirectory', true)

      expect(composer.shouldMoveResult()).toBe(false)
    })

    it('should return false when not using the move option, but using an output directory', () => {
      atom.config.set('latex.outputDirectory', 'baz')
      atom.config.set('latex.moveResultToSourceDirectory', false)

      expect(composer.shouldMoveResult()).toBe(false)
    })

    it('should return true when using both an output directory and the move option', () => {
      atom.config.set('latex.outputDirectory', 'baz')
      atom.config.set('latex.moveResultToSourceDirectory', true)

      expect(composer.shouldMoveResult()).toBe(true)
    })
  })

  describe('getBuilder', () => {
    beforeEach(() => {
      atom.config.set('latex.builder', 'latexmk')
    })

    it('returns a builder instance as configured for regular .tex files', () => {
      const filePath = 'foo.tex'

      expect(composer.getBuilder(filePath).constructor.name).toEqual('LatexmkBuilder')

      atom.config.set('latex.builder', 'texify')
      expect(composer.getBuilder(filePath).constructor.name).toEqual('TexifyBuilder')
    })

    it('returns null when passed an unhandled file type', () => {
      const filePath = 'quux.txt'
      expect(composer.getBuilder(filePath)).toBeNull()
    })
  })

  describe('sync', () => {
    it('silently does nothing when the current editor is transient', () => {
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath: null })
      spyOn(composer, 'resolveOutputFilePath').andCallThrough()
      spyOn(latex, 'getOpener').andCallThrough()

      composer.sync()

      expect(composer.resolveOutputFilePath).not.toHaveBeenCalled()
      expect(latex.getOpener).not.toHaveBeenCalled()
    })

    it('logs a warning and returns when an output file cannot be resolved', () => {
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath: 'file.tex', lineNumber: 1 })
      spyOn(composer, 'resolveOutputFilePath').andReturn()
      spyOn(latex, 'getOpener').andCallThrough()
      spyOn(latex.log, 'warning').andCallThrough()

      composer.sync()

      expect(latex.log.warning).toHaveBeenCalled()
      expect(latex.getOpener).not.toHaveBeenCalled()
    })

    it('launches the opener using editor metadata and resolved output file', () => {
      const filePath = 'file.tex'
      const lineNumber = 1
      const outputFilePath = 'file.pdf'
      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath, lineNumber })
      spyOn(composer, 'resolveOutputFilePath').andReturn(outputFilePath)

      const opener = jasmine.createSpyObj('MockOpener', ['open'])
      spyOn(latex, 'getOpener').andReturn(opener)

      composer.sync()

      expect(opener.open).toHaveBeenCalledWith(outputFilePath, filePath, lineNumber)
    })

    it('launches the opener using editor metadata and resolved output file with jobnames', () => {
      const filePath = 'file.tex'
      const lineNumber = 1
      const rootFilePath = filePath
      const builder = jasmine.createSpyObj('MockBuilder', ['run', 'constructArgs', 'parseLogAndFdbFiles', 'getJobNamesFromMagic'])
      const jobnames = ['foo', 'bar']

      spyOn(werkzeug, 'getEditorDetails').andReturn({ filePath, lineNumber })
      spyOn(composer, 'resolveOutputFilePath').andCallFake((builder, rootFilePath, jobname) => jobname + '.pdf')
      spyOn(composer, 'initializeBuild').andReturn({ rootFilePath, builder, jobnames })

      const opener = jasmine.createSpyObj('MockOpener', ['open'])
      spyOn(latex, 'getOpener').andReturn(opener)

      composer.sync()

      expect(opener.open).toHaveBeenCalledWith('foo.pdf', filePath, lineNumber)
      expect(opener.open).toHaveBeenCalledWith('bar.pdf', filePath, lineNumber)
    })
  })
})
