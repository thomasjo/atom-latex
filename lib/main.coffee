{CompositeDisposable} = require 'atom'
Composer = require './composer'
ConfigSchema = require './config-schema'

module.exports =
  config: ConfigSchema

  activate: ->
    require './bootstrap'

    @subscriptions = new CompositeDisposable()
    @composer = new Composer()

    @subscriptions.add atom.commands.add 'atom-workspace', 'latex:build', => @composer.build()
    @subscriptions.add atom.commands.add 'atom-workspace', 'latex:sync', => @composer.sync()
    @subscriptions.add atom.commands.add 'atom-workspace', 'latex:clean', => @composer.clean()

  deactivate: ->
    @subscriptions.dispose()

    @composer?.destroy()
    @composer = null

  consumeStatusBar: (statusBar) ->
    @composer.setStatusBar(statusBar)
