/** @babel */

import '../spec-helpers'

import path from 'path'
import FdbParser from '../../lib/parsers/fdb-parser'

describe('FdbParser', () => {
  let fixturesPath, fdbFile, texFile

  beforeEach(() => {
    fixturesPath = atom.project.getPaths()[0]
    fdbFile = path.join(fixturesPath, 'file.fdb_latexmk')
    texFile = path.join(fixturesPath, 'file.tex')
  })

  describe('parse', () => {
    it('returns the expected generated files', () => {
      const parser = new FdbParser(fdbFile, texFile)
      const result = parser.parse()
      const expectedResult = {
        pdflatex: {
          source: [
            '/foo/output/file.aux',
            '/usr/local/texlive/2016/texmf-dist/fonts/map/fontname/texfonts.map',
            '/usr/local/texlive/2016/texmf-dist/fonts/tfm/public/cm/cmbx10.tfm',
            '/usr/local/texlive/2016/texmf-dist/fonts/tfm/public/cm/cmbx12.tfm',
            '/usr/local/texlive/2016/texmf-dist/fonts/tfm/public/cm/cmmi12.tfm',
            '/usr/local/texlive/2016/texmf-dist/fonts/tfm/public/cm/cmr12.tfm',
            '/usr/local/texlive/2016/texmf-dist/fonts/tfm/public/cm/cmsy10.tfm',
            '/usr/local/texlive/2016/texmf-dist/fonts/type1/public/amsfonts/cm/cmbx10.pfb',
            '/usr/local/texlive/2016/texmf-dist/fonts/type1/public/amsfonts/cm/cmbx12.pfb',
            '/usr/local/texlive/2016/texmf-dist/fonts/type1/public/amsfonts/cm/cmr10.pfb',
            '/usr/local/texlive/2016/texmf-dist/tex/latex/base/article.cls',
            '/usr/local/texlive/2016/texmf-dist/tex/latex/base/size10.clo',
            '/usr/local/texlive/2016/texmf-dist/web2c/texmf.cnf',
            '/usr/local/texlive/2016/texmf-var/fonts/map/pdftex/updmap/pdftex.map',
            '/usr/local/texlive/2016/texmf-var/web2c/pdftex/pdflatex.fmt',
            '/usr/local/texlive/2016/texmf.cnf',
            'file.tex',
            'output/file.aux'
          ],
          generated: [
            '/foo/output/file.pdfsync',
            '/foo/output/file.pdf',
            'output/file.log',
            'output/file.pdf',
            '/foo/output/file.log',
            'output/file.aux'
          ]
        }
      }

      expect(result).toEqual(expectedResult)
    })
  })

  describe('getLines', () => {
    it('returns the expected number of lines', () => {
      const fdbFile = path.join(fixturesPath, 'file.fdb_latexmk')
      const texFile = path.join(fixturesPath, 'file.tex')
      const parser = new FdbParser(fdbFile, texFile)
      const lines = parser.getLines()

      expect(lines.length).toBe(28)
    })

    it('throws an error when passed a filepath that does not exist', () => {
      const fdbFile = path.join(fixturesPath, 'nope.fdb_latexmk')
      const texFile = path.join(fixturesPath, 'nope.tex')
      const parser = new FdbParser(fdbFile, texFile)

      expect(parser.getLines).toThrow()
    })
  })
})
