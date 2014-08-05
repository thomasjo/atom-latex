{View, WorkspaceView} = require "atom"
fs = require "fs-plus"
path = require "path"
temp = require "temp"
wrench = require "wrench"
latex = require "../lib/latex"

class StatusBarMock extends View
  @content: ->
    @div class: "status-bar tool-panel panel-bottom", =>
      @div outlet: "rightPanel", class: "status-bar-right pull-right"

  attach: -> atom.workspaceView.appendToTop(this)
  prependRight: (view) -> @rightPanel.append(view)

describe "Latex", ->
  [tempPath] = []

  beforeEach ->
    tempPath = fs.realpathSync(temp.mkdirSync("atom-latex"))
    fixturesPath = atom.project.getPath()
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, forceDelete: true)
    atom.project.setPath(tempPath)

    atom.workspaceView = new WorkspaceView
    atom.workspaceView.statusBar = new StatusBarMock
    atom.workspaceView.statusBar.attach()
    atom.workspace = atom.workspaceView.model

  describe "build", ->
    it "does nothing for new, unsaved files", ->
      editor = atom.workspace.openSync()

      spyOn(latex, "build").andCallThrough()
      spyOn(latex, "showResult").andCallThrough()
      spyOn(latex, "showError").andCallThrough()
      latex.build()

      waitsFor -> latex.build.callCount == 1
      runs ->
        expect(latex.showResult).not.toHaveBeenCalled()
        expect(latex.showError).not.toHaveBeenCalled()

    it "runs `latexmk` for existing files", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalled()

    it "saves the file before building, if modified", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      editor.moveCursorToBottom()
      editor.insertNewline()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(editor.isModified()).toEqual(false)

    it "supports paths containing spaces", ->
      editor = atom.workspace.openSync("filename with spaces.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalled()

    it "invokes `showResult` after a successful build, with expect log parsing result", ->
      editor = atom.workspace.openSync("file.tex")

      spyOn(latex, "showResult").andCallThrough()
      latex.build()

      waitsFor -> latex.showResult.callCount == 1
      runs -> expect(latex.showResult).toHaveBeenCalledWith {
        outputFilePath: path.join(tempPath, "file.pdf")
        errors: []
        warnings: []
      }
