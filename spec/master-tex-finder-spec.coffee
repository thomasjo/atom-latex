MasterTexFinder = require '../lib/master-tex-finder'
path = require 'path'

describe 'MasterTexFinder', ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = path.join(atom.project.getPath(), 'master-tex-finder')

  describe 'masterTexPath', ->
    it 'returns the master tex file for the current project', ->
      inc2Path = path.join(fixturesPath, 'inc2.tex')
      mtFinder = new MasterTexFinder(inc2Path)
      expect( path.basename(mtFinder.masterTexPath()) ).toEqual('master.tex')

    it 'immediately return the given file, if itself is a root-file', ->
      masterFile = path.join( fixturesPath, 'master.tex' )
      mtFinder = new MasterTexFinder(masterFile)
      spyOn(mtFinder, 'texFilesList')
      expect( mtFinder.masterTexPath() ).toEqual( masterFile )
      expect( mtFinder.texFilesList ).not.toHaveBeenCalled()

  describe 'isMasterFile', ->
    it 'returns true if the given file is the master file', ->
      inc2Path = path.join(fixturesPath, 'inc2.tex')
      mtFinder = new MasterTexFinder(inc2Path)
      masterFilePath = path.join(fixturesPath,'master.tex')
      expect( mtFinder.isMasterFile( masterFilePath ) ).toBe true

  describe 'texFilesList', ->
    it 'returns the list of tex files in the project directory', ->
      inc2Path = path.join(fixturesPath, 'inc2.tex')
      mtFinder = new MasterTexFinder(inc2Path)
      sortedFileList = mtFinder.texFilesList().sort (n1,n2) ->
        n1 > n2 ? 1 : (n1 == n2 ? 0 : -1)

      expect(sortedFileList).toEqual( ['inc1.tex', 'inc2.tex', 'inc3.tex', 'master.tex'] )
