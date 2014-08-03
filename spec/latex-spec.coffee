fs = require "fs-plus"
path = require "path"
temp = require "temp"
wrench = require "wrench"
{View, WorkspaceView} = require "atom"
latex = require "../lib/latex"
Builder = require "../lib/builder"

class StatusBarMock extends View
  @content: ->
    @div class: "status-bar tool-panel panel-bottom", =>
      @div outlet: "rightPanel", class: "status-bar-right pull-right"

  attach: -> atom.workspaceView.appendToTop(this)
  prependRight: (view) -> @rightPanel.append(view)

class BuilderMock extends Builder
  run: (args, callback) -> callback(0)
  constructArgs: (filePath) -> []
  constructPath: -> ""
  parseLogFile: (texFilePath) ->
    result: outputFilePath: texFilePath.replace(/\.tex$/, ".pdf")

describe "Latex", ->
  beforeEach ->
    tempPath = fs.realpathSync(temp.mkdirSync("atom-latex"))
    fixturesPath = atom.project.getPath()
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, forceDelete: true)
    atom.project.setPath(tempPath)

    atom.workspaceView = new WorkspaceView
    atom.workspaceView.statusBar = new StatusBarMock
    atom.workspaceView.statusBar.attach()
    atom.workspace = atom.workspaceView.model

    # Ensure package has sensible config values
    atom.config.set("latex.texPath", "")
    atom.config.set("latex.outputDirectory", "output")
    atom.config.set("latex.enableShellEscape", false)

    spyOn(latex, "getBuilder").andReturn(new BuilderMock)

  describe "build", ->
    it "does nothing for new, unsaved files", ->
      editor = atom.workspace.openSync()
      fakeInvoked = false
      fake = -> fakeInvoked = true

      spyOn(latex, "showResult").andCallFake(fake)
      spyOn(latex, "showError").andCallFake(fake)

      expect(fakeInvoked).toEqual(false)

    it "runs `latexmk` for existing files", ->
      editor = atom.workspace.openSync("file.tex")
      [exitCode, done] = []

      spyOn(latex, "showResult").andCallFake -> done = true
      latex.build()

      waitsFor -> done
      runs -> expect(latex.showResult).toHaveBeenCalled();

    it "saves the file before building, if modified", ->
      editor = atom.workspace.openSync("file.tex")

      editor.moveCursorToBottom()
      editor.insertNewline()
      latex.build()

      expect(editor.isModified()).toEqual(false)

    it "supports paths containing spaces", ->
      editor = atom.workspace.openSync("filename with spaces.tex")
      [exitCode, done] = []

      spyOn(latex, "showResult").andCallFake -> done = true
      latex.build()

      waitsFor -> done
      runs -> expect(latex.showResult).toHaveBeenCalled();
