'use babel'

import helpers from './spec-helpers'
import path from 'path'
import MasterTexFinder from '../lib/master-tex-finder'

describe('MasterTexFinder', () => {
  let rootPath, fixturesPath

  beforeEach(() => {
    rootPath = atom.project.getPaths()[0]
    fixturesPath = path.join(rootPath, 'master-tex-finder', 'single-master')

    atom.config.set('latex.useMasterFileSearch', true)
  })

  describe('getMasterTexPath', () => {
    it('returns the master tex file for the current project', () => {
      const inc2Path = path.join(fixturesPath, 'inc2.tex')
      const finder = new MasterTexFinder(inc2Path)

      expect(finder.getMasterTexPath()).toBe(path.join(fixturesPath, 'master.tex'))
    })

    it('immediately return the given file, if itself is a root-file', () => {
      const masterFile = path.join(fixturesPath, 'master.tex')
      const finder = new MasterTexFinder(masterFile)
      spyOn(finder, 'getTexFilesList').andCallThrough()

      expect(finder.getMasterTexPath()).toBe(masterFile)
      expect(finder.getTexFilesList).not.toHaveBeenCalled()
    })

    it('returns the original file if more than one file is a master file', () => {
      const multiMasterFixturePath = path.join(rootPath, 'master-tex-finder', 'multiple-masters')
      const inc1Path = path.join(multiMasterFixturePath, 'inc1.tex')
      const finder = new MasterTexFinder(inc1Path)

      expect(finder.getMasterTexPath()).toBe(inc1Path)
    })

    it('immediately returns the file specified by the magic comment when present', () => {
      const inc1Path = path.join(fixturesPath, 'inc1.tex')
      const finder = new MasterTexFinder(inc1Path)

      spyOn(finder, 'getTexFilesList').andCallThrough()

      expect(finder.getMasterTexPath()).toBe(path.join(fixturesPath, 'master.tex'))
      expect(finder.getTexFilesList).not.toHaveBeenCalled()
    })

    it('returns the original file if the heuristic search feature is disabled', () => {
      const inc2Path = path.join(fixturesPath, 'inc2.tex')
      const finder = new MasterTexFinder(inc2Path)

      helpers.spyOnConfig('latex.useMasterFileSearch', false)
      spyOn(finder, 'isMasterFile').andCallThrough()
      spyOn(finder, 'searchForMasterFile').andCallThrough()

      expect(finder.getMasterTexPath()).toBe(inc2Path)
      expect(finder.isMasterFile).not.toHaveBeenCalled()
      expect(finder.searchForMasterFile).not.toHaveBeenCalled()
    })
  })

  describe('isMasterFile', () => {
    it('returns true if the given file is the master file', () => {
      const masterFilePath = path.join(fixturesPath, 'master.tex')
      const inc2Path = path.join(fixturesPath, 'inc2.tex')
      const finder = new MasterTexFinder(inc2Path)

      expect(finder.isMasterFile(masterFilePath)).toBe(true)
    })
  })

  describe('getTexFilesList', () => {
    it('returns the list of tex files in the project directory', () => {
      const expectedFileList = ['inc1.tex', 'inc2.tex', 'inc3.tex', 'master.tex']
        .map(name => path.join(fixturesPath, name))
      const inc2Path = path.join(fixturesPath, 'inc2.tex')
      const finder = new MasterTexFinder(inc2Path)
      const sortedFileList = finder.getTexFilesList().sort()

      expect(sortedFileList).toEqual(expectedFileList)
    })
  })
})
