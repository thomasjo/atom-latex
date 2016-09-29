/** @babel */

import './spec-bootstrap'
import fs from 'fs-plus'
import _ from 'lodash'
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
      spyOn(werkzeug, 'getEditorDetails').andReturn({
        editor: editor,
        filePath: filePath
      })

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
        return composer.build().catch(r => { result = r })
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
        return composer.build().catch(r => { result = r })
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
    const extensions = ['.bar', '.baz', '.quux']

    function fakeFilePaths (filePath) {
      const filePathSansExtension = filePath.substring(0, filePath.lastIndexOf('.'))
      return extensions.map(ext => filePathSansExtension + ext)
    }

    function initializeSpies (filePath) {
      spyOn(werkzeug, 'getEditorDetails').andReturn({filePath})
      spyOn(composer, 'resolveRootFilePath').andReturn(filePath)
    }

    beforeEach(() => {
      spyOn(fs, 'remove').andCallThrough()
      atom.config.set('latex.cleanExtensions', extensions)
    })

    it('deletes all files for the current tex document when output has not been redirected', () => {
      const filePath = path.normalize('/a/foo.tex')
      const filesToDelete = fakeFilePaths(filePath)
      initializeSpies(filePath)

      let candidatePaths
      waitsForPromise(() => {
        return composer.clean().then(resolutions => {
          candidatePaths = _.map(resolutions, 'filePath')
        })
      })

      runs(() => {
        expect(candidatePaths).toEqual(filesToDelete)
      })
    })

    it('stops immidiately if the file is not a TeX document', () => {
      const filePath = 'foo.bar'
      initializeSpies(filePath, [])

      waitsForPromise(() => {
        return composer.clean().catch(r => r)
      })

      runs(() => {
        expect(composer.resolveRootFilePath).not.toHaveBeenCalled()
        expect(fs.remove).not.toHaveBeenCalled()
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
      spyOn(composer, 'getEditorDetails').andReturn({ filePath: null })
      spyOn(composer, 'resolveOutputFilePath').andCallThrough()
      spyOn(latex, 'getOpener').andCallThrough()

      composer.sync()

      expect(composer.resolveOutputFilePath).not.toHaveBeenCalled()
      expect(latex.getOpener).not.toHaveBeenCalled()
    })

    it('logs a warning and returns when an output file cannot be resolved', () => {
      spyOn(composer, 'getEditorDetails').andReturn({ filePath: 'file.tex', lineNumber: 1 })
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
      spyOn(composer, 'getEditorDetails').andReturn({ filePath, lineNumber })
      spyOn(composer, 'resolveOutputFilePath').andReturn(outputFilePath)

      const opener = jasmine.createSpyObj('MockOpener', ['open'])
      console.log(opener)
      spyOn(latex, 'getOpener').andReturn(opener)

      composer.sync()

      expect(opener.open).toHaveBeenCalledWith(outputFilePath, filePath, lineNumber)
    })
  })

  describe('moveResult', () => {
    const texFilePath = path.normalize('/angle/gronk.tex')
    const outputFilePath = path.normalize('/angle/dangle/gronk.pdf')
    const result = { outputFilePath }

    beforeEach(() => {
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
})
