_ = require 'underscore-plus'
path = require 'path'

module.exports =
class Builder
  constructor: ->
    @envPathKey = switch process.platform
      when 'win32' then 'Path'
      else 'PATH'

  run: (args, callback) -> undefined
  constructArgs: (filePath) -> undefined
  parseLogFile: (texFilePath) -> undefined

  constructChildProcessOptions: ->
    env = _.clone(process.env)
    env[@envPathKey] = childPath if childPath = @constructPath()
    options = env: env

  constructPath: ->
    texPath = atom.config.get('latex.texPath')?.trim()
    texPath = @defaultTexPath() unless texPath?.length
    processPath = process.env[@envPathKey]

    if match = texPath.match /^(.*)(\$PATH)(.*)$/
      texPath = "#{match[1]}#{processPath}#{match[3]}"
    else
      texPath = [texPath, processPath].join(path.delimiter)

  defaultTexPath: ->
    switch process.platform
      when 'win32'
        [
          'C:\\texlive\\2014\\bin\\win32'
          'C:\\Program Files\\MiKTeX 2.9\\miktex\\bin\\x64'
          'C:\\Program Files (x86)\\MiKTeX 2.9\\miktex\\bin'
        ].join(';')
      else
        '/usr/texbin'

  resolveLogFilePath: (texFilePath) ->
    outputDirectory = atom.config.get('latex.outputDirectory') ? ''
    currentDirectory = path.dirname(texFilePath)
    fileName = path.basename(texFilePath).replace(/\.\w+$/, '.log')
    logFilePath = path.join(currentDirectory, outputDirectory, fileName)
