MasterTexFinder = require '../lib/master-tex-finder'
path = require 'path'

describe 'MasterTexFinder', ->
  mtFinder = null

  beforeEach ->
    fixturesPath = atom.project.getPath()
    inc2Path = path.join(fixturesPath, 'master-tex-finder', 'inc2.tex')
    mtFinder = new MasterTexFinder(inc2Path)

  describe 'masterTexPath', ->
    it 'returns the master tex file for the current project', ->
      expect(path.basename(mtFinder.masterTexPath())).toEqual('master.tex')

  describe 'isMasterFile', ->
    it 'returns true if the given file is the master file', ->
      expect(mtFinder.isMasterFile('master.tex')).toBe true

  describe 'texFilesList', ->
    it 'returns the list of tex files in the project directory', ->
      sortedFileList = mtFinder.texFilesList().sort (n1,n2) ->
        n1 > n2 ? 1 : (n1 == n2 ? 0 : -1)

      expect(sortedFileList).toEqual( ['inc1.tex', 'inc2.tex', 'inc3.tex', 'master.tex'] )
