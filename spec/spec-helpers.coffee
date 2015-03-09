require './spec-bootstrap'
_ = require 'underscore-plus'
fs = require 'fs-plus'
temp = require 'temp'
wrench = require 'wrench'
Opener = require '../lib/opener'

class NullOpener extends Opener
  open: (filePath, texPath, lineNumber, callback) ->

module.exports =
  cloneFixtures: ->
    tempPath = fs.realpathSync(temp.mkdirSync('latex'))
    fixturesPath = atom.project.getPaths()[0]
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, forceDelete: true)
    atom.project.setPaths([tempPath])
    fixturesPath = tempPath

  overridePlatform: (name) ->
    Object.defineProperty(process, 'platform', {__proto__: null, value: name})

  spyOnConfig: (key, value) ->
    spyOn(atom.config, 'get').andCallFake (_key) ->
      return value if _key is key

  setTimeoutInterval: (interval) ->
    env = jasmine.getEnv()
    originalInterval = env.defaultTimeoutInterval
    env.defaultTimeoutInterval = interval
    originalInterval

  nullOpener: -> new NullOpener()
