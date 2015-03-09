Composer = require './composer'
ConfigSchema = require './config-schema'

module.exports =
  config: ConfigSchema

  activate: ->
    require './bootstrap'

    @composer = new Composer()

    atom.commands.add 'atom-workspace', 'latex:build', => @composer.build()
    atom.commands.add 'atom-workspace', 'latex:sync', => @composer.sync()
    atom.commands.add 'atom-workspace', 'latex:clean', => @composer.clean()

  consumeStatusBar: (statusBar) ->
    @composer.setStatusBar(statusBar)
