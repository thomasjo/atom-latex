ConfigSchema = require './config-schema'

module.exports =
  config: ConfigSchema

  activate: ->
    @commands = atom.commands.add 'atom-workspace',
      'latex:build': =>
        @bootstrap()
        @composer.build()
      'latex:sync': =>
        @bootstrap()
        @composer.sync()
      'latex:clean': =>
        @bootstrap()
        @composer.clean()

  deactivate: ->
    @commands?.dispose()
    @composer?.destroy()
    @composer = null

  consumeStatusBar: (statusBar) ->
    @bootstrap()
    @composer.setStatusBar(statusBar)

  bootstrap: ->
    return if @bootstrapped

    Latex = require './latex'
    window.latex = new Latex()
    latex.initialize()

    Composer = require './composer'
    @composer = new Composer()
    @bootstrapped = true
