/** @babel */

import path from 'path'
import helpers from './spec-helpers'
import werkzeug from '../lib/werkzeug'

describe('werkzeug', () => {
  let fixturesPath

  beforeEach(() => {
    waitsForPromise(() => {
      return helpers.activatePackages()
    })
    fixturesPath = helpers.cloneFixtures()
  })

  describe('getEditorDetails', () => {
    it('verifies correct file is analyzed and identified as a LaTeX source when passed LaTeX document', () => {
      const filePath = path.join(fixturesPath, 'file.tex')

      waitsForPromise(() => {
        return atom.workspace.open(filePath)
      })

      runs(() => {
        const { editor, ...rest } = werkzeug.getEditorDetails()
        expect(rest).toEqual({
          filePath,
          position: { row: 0, column: 0 },
          lineNumber: 1,
          isLatex: true
        })
      })
    })

    it('verifies correct file is analyzed and identified as a LaTeX source when passed R-noweb document', () => {
      const filePath = path.join(fixturesPath, 'knitr', 'file.Rnw')

      waitsForPromise(() => {
        return atom.workspace.open(filePath)
      })

      runs(() => {
        const { editor, ...rest } = werkzeug.getEditorDetails()
        expect(rest).toEqual({
          filePath,
          position: { row: 0, column: 0 },
          lineNumber: 1,
          isLatex: true
        })
      })
    })

    it('verifies correct file is analyzed and identified as a LaTeX source when passed literate Agda document', () => {
      const filePath = path.join(fixturesPath, 'literate', 'file.lagda')

      waitsForPromise(() => {
        return atom.workspace.open(filePath)
      })

      runs(() => {
        const { editor, ...rest } = werkzeug.getEditorDetails()
        expect(rest).toEqual({
          filePath,
          position: { row: 0, column: 0 },
          lineNumber: 1,
          isLatex: true
        })
      })
    })

    it('verifies correct file is analyzed and identified as a LaTeX source when passed P-noweb document', () => {
      const filePath = path.join(fixturesPath, 'literate', 'file.Pnw')

      waitsForPromise(() => {
        return atom.workspace.open(filePath)
      })

      runs(() => {
        const { editor, ...rest } = werkzeug.getEditorDetails()
        expect(rest).toEqual({
          filePath,
          position: { row: 0, column: 0 },
          lineNumber: 1,
          isLatex: true
        })
      })
    })

    it('verifies correct file is analyzed and identified as a LaTeX source when passed literate Haskell document', () => {
      const filePath = path.join(fixturesPath, 'literate', 'file.lhs')

      waitsForPromise(() => {
        return atom.workspace.open(filePath)
      })

      runs(() => {
        const { editor, ...rest } = werkzeug.getEditorDetails()
        expect(rest).toEqual({
          filePath,
          position: { row: 0, column: 0 },
          lineNumber: 1,
          isLatex: true
        })
      })
    })

    it('verifies correct file is analyzed and identified as not a LaTeX source when passed non-source file', () => {
      const filePath = path.join(fixturesPath, 'file.fdb_latexmk')

      waitsForPromise(() => {
        return atom.workspace.open(filePath)
      })

      runs(() => {
        const { editor, ...rest } = werkzeug.getEditorDetails()
        expect(rest).toEqual({
          filePath,
          position: { row: 0, column: 0 },
          lineNumber: 1,
          isLatex: false
        })
      })
    })
  })
})
