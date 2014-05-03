{WorkspaceView} = require "atom"

fs = require "fs-plus"
path = require "path"
temp = require "temp"
wrench = require "wrench"

latex = require "../lib/latex"

describe "Latex", ->
  beforeEach ->
    tempPath = fs.realpathSync(temp.mkdirSync("atom-latex"))
    fixturesPath = atom.project.getPath()
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, forceDelete: true)
    atom.project.setPath(tempPath)

    atom.workspaceView = new WorkspaceView
    atom.workspace = atom.workspaceView.model

    # Ensure package has sensible config values
    atom.config.set("latex.texPath", "#{fixturesPath}:$PATH")
    atom.config.set("latex.outputDirectory", "output")

  describe "build", ->
    it "does nothing for new, unsaved files", ->
      editor = atom.workspaceView.openSync()
      fakeInvoked = false
      fake = -> fakeInvoked = true

      spyOn(latex, "showResult").andCallFake(fake)
      spyOn(latex, "showError").andCallFake(fake)

      expect(fakeInvoked).toEqual(false)

    it "runs `latexmk` for existing files", ->
      editor = atom.workspaceView.openSync("file.tex")
      [exitCode, done] = []

      spyOn(latex, "showResult").andCallFake -> done = true
      latex.build()

      waitsFor -> done
      runs -> expect(latex.showResult).toHaveBeenCalled();

    it "saves the file before building, if modified", ->
      editor = atom.workspaceView.openSync("file.tex")

      editor.moveCursorToBottom()
      editor.insertNewline()
      latex.build()

      expect(editor.isModified()).toEqual(false)
