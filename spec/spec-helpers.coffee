_ = require "underscore-plus"
{View, WorkspaceView} = require "atom"
fs = require "fs-plus"
temp = require "temp"
wrench = require "wrench"

class StatusBarMock extends View
  @content: ->
    @div class: "status-bar tool-panel panel-bottom", =>
      @div outlet: "rightPanel", class: "status-bar-right pull-right"

  attach: -> atom.workspaceView.appendToTop(this)
  prependRight: (view) -> @rightPanel.append(view)

module.exports =
  cloneFixtures: ->
    tempPath = fs.realpathSync(temp.mkdirSync("latex"))
    fixturesPath = atom.project.getPath()
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, forceDelete: true)
    atom.project.setPath(tempPath)
    fixturesPath = tempPath

  mockStatusBar: ->
    atom.workspaceView = new WorkspaceView()
    atom.workspaceView.statusBar = new StatusBarMock()
    atom.workspaceView.statusBar.attach()
    atom.workspace = atom.workspaceView.model

  overridePlatform: (name) ->
    Object.defineProperty(process, "platform", {__proto__:null, value: name})

  spyOnConfig: (key, value) ->
    spyOn(atom.config, "get").andCallFake (_key) =>
      return value if _key is key
