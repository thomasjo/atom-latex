{WorkspaceView} = require "atom"

fs = require "fs-plus"
path = require "path"
temp = require "temp"
wrench = require "wrench"

latex = require "../lib/latex"

describe "Latex", ->
  [editor] = []

  beforeEach ->
    tempPath = fs.realpathSync(temp.mkdirSync("atom-latex"))
    fixturesPath = atom.project.getPath()
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, forceDelete: true)
    atom.project.setPath(tempPath)

    atom.workspaceView = new WorkspaceView
    atom.workspace = atom.workspaceView.model

    # Ensure package has sensible config values
    atom.config.set("latex.latexmkPath", path.join(fixturesPath, "latexmk.sh"))
    atom.config.set("latex.outputDirectory", "output")

  describe "build", ->
    it "does nothing for new, unsaved files", ->
      editor = atom.workspaceView.openSync()
      exitCode = latex.build()

      expect(exitCode).toEqual(-1)

    it "runs `latexmk` for existing files", ->
      editor = atom.workspaceView.openSync("file.tex")
      exitCode = latex.build()

      expect(exitCode).toEqual(0)

    it "saves the file before building, if modified", ->
      editor = atom.workspaceView.openSync("file.tex")
      editor.moveCursorToBottom()
      editor.insertNewline()
      expect(editor.isModified()).toEqual(true)

      latex.build()
      expect(editor.isModified()).toEqual(false)
