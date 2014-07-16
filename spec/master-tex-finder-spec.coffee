path = require "path"
MasterTexFinder = require "../lib/master-tex-finder"

describe "MasterTexFinder", ->
  [fixturesPath] = []

  beforeEach ->
    fixturesPath = path.join(atom.project.getPath(), "master-tex-finder", "single-master")

  describe "getMasterTexPath", ->
    it "returns the master tex file for the current project", ->
      inc2Path = path.join(fixturesPath, "inc2.tex")
      finder = new MasterTexFinder(inc2Path)
      expect(finder.getMasterTexPath()).toEqual(path.join(fixturesPath,"master.tex"))

    it "immediately return the given file, if itself is a root-file", ->
      masterFile = path.join(fixturesPath, "master.tex")
      finder = new MasterTexFinder(masterFile)
      spyOn(finder, "getTexFilesList").andCallThrough()
      expect(finder.getMasterTexPath()).toEqual(masterFile)
      expect(finder.getTexFilesList).not.toHaveBeenCalled()


    it "returns the original file if more than one file is a master file", ->
      multiMasterFixturePath = path.join(atom.project.getPath(), "master-tex-finder", "multiple-masters")
      inc2Path = path.join(multiMasterFixturePath, "inc2.tex")
      mtFinder = new MasterTexFinder(inc2Path)
      expect(mtFinder.getMasterTexPath()).toEqual(inc2Path)

    it "immediately return the given file, if itself is a root-file", ->
      masterFile = path.join(fixturesPath, "master.tex")
      mtFinder = new MasterTexFinder(masterFile)
      spyOn(mtFinder, "getTexFilesList").andCallThrough()
      expect(mtFinder.getMasterTexPath()).toEqual(masterFile)
      expect(mtFinder.getTexFilesList).not.toHaveBeenCalled()

    it "returns the correct master file when more than one master is present", ->
      multiMasterFixturePath = path.join(atom.project.getPath(), "master-tex-finder", "multiple-masters")
      inc1Path = path.join(multiMasterFixturePath, "inc1.tex")
      mtFinder = new MasterTexFinder(inc1Path)
      master1Path = path.join(multiMasterFixturePath, "master1.tex")
      expect(mtFinder.getMasterTexPath()).toEqual(master1Path)

    it "immediately returns the file specified by the magic comment when present", ->
      inc1Path = path.join(fixturesPath, "inc1.tex")
      finder = new MasterTexFinder(inc1Path)
      spyOn(finder, "getTexFilesList").andCallThrough()
      expect(finder.getMasterTexPath()).toEqual(path.join(fixturesPath,"master.tex"))
      expect(finder.getTexFilesList).not.toHaveBeenCalled()

  describe "isMasterFile", ->
    it "returns true if the given file is the master file", ->
      inc2Path = path.join(fixturesPath, "inc2.tex")
      finder = new MasterTexFinder(inc2Path)
      masterFilePath = path.join(fixturesPath,"master.tex")
      expect(finder.isMasterFile(masterFilePath)).toBe true

  describe "getTexFilesList", ->
    it "returns the list of tex files in the project directory", ->
      inc2Path = path.join(fixturesPath, "inc2.tex")
      finder = new MasterTexFinder(inc2Path)
      sortedFileList = finder.getTexFilesList().sort (n1,n2) ->
        n1 > n2 ? 1 : (n1 == n2 ? 0 : -1)
      expect(sortedFileList).toEqual(["inc1.tex", "inc2.tex", "inc3.tex", "master.tex"])

  describe "isInvalidFile", ->
    it "returns true if the given file name is invalid", ->
      finder = new MasterTexFinder("bar.tex")
      expect(finder.isInvalidFilePath("bar.tex")).toBe(true)

  describe "detectChildren", ->
    it "returns the list of children of a given file", ->
      masterPath = path.join(fixturesPath, "master.tex")
      mtFinder = new MasterTexFinder(masterPath)
      children = mtFinder.detectChildren(masterPath)
      childList = ["inc1.tex", "inc2.tex", "inc3.tex"].map (file)->
        path.join(fixturesPath, file)
      expect(children).toEqual(childList)
