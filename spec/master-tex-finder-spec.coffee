path = require 'path'
MasterTexFinder = require '../lib/master-tex-finder'

describe "MasterTexFinder", ->
  [rootPath, fixturesPath] = []

  beforeEach ->
    rootPath = atom.project.getPaths()[0]
    fixturesPath = path.join(rootPath, 'master-tex-finder', 'single-master')

  describe "getMasterTexPath", ->
    it "returns the master tex file for the current project", ->
      inc2Path = path.join(fixturesPath, 'inc2.tex')
      finder = new MasterTexFinder(inc2Path)

      expect(finder.getMasterTexPath()).toEqual(path.join(fixturesPath, 'master.tex'))

    it "immediately return the given file, if itself is a root-file", ->
      masterFile = path.join(fixturesPath, 'master.tex')
      finder = new MasterTexFinder(masterFile)

      spyOn(finder, 'getTexFilesList').andCallThrough()

      expect(finder.getMasterTexPath()).toEqual(masterFile)
      expect(finder.getTexFilesList).not.toHaveBeenCalled()

    it "returns the original file if more than one file is a master file", ->
      multiMasterFixturePath = path.join(rootPath, 'master-tex-finder', 'multiple-masters')
      master1Path = path.join(multiMasterFixturePath, 'master1.tex')
      master2Path = path.join(multiMasterFixturePath, 'master2.tex')
      inc1Path = path.join(multiMasterFixturePath, 'inc1.tex')
      finder = new MasterTexFinder(inc1Path)

      expect(finder.getMasterTexPath()).toEqual(inc1Path)

    it "immediately returns the file specified by the magic comment when present", ->
      inc1Path = path.join(fixturesPath, 'inc1.tex')
      finder = new MasterTexFinder(inc1Path)

      spyOn(finder, 'getTexFilesList').andCallThrough()

      expect(finder.getMasterTexPath()).toEqual(path.join(fixturesPath, 'master.tex'))
      expect(finder.getTexFilesList).not.toHaveBeenCalled()

  describe "isMasterFile", ->
    it "returns true if the given file is the master file", ->
      masterFilePath = path.join(fixturesPath, 'master.tex')
      inc2Path = path.join(fixturesPath, 'inc2.tex')
      finder = new MasterTexFinder(inc2Path)

      expect(finder.isMasterFile(masterFilePath)).toEqual(true)

  describe "getTexFilesList", ->
    it "returns the list of tex files in the project directory", ->
      expectedFileList = ['inc1.tex', 'inc2.tex', 'inc3.tex', 'master.tex']
      expectedFileList = expectedFileList.map (name) -> path.join(fixturesPath, name)
      inc2Path = path.join(fixturesPath, 'inc2.tex')
      finder = new MasterTexFinder(inc2Path)
      sortedFileList = finder.getTexFilesList().sort()

      expect(sortedFileList).toEqual(expectedFileList)
