'use babel'

import Logger from '../logger'
import {heredoc} from '../werkzeug'

export default class ConsoleLogger extends Logger {
  error (statusCode, result, builder) {
    console.group('LaTeX errors')
    switch (statusCode) {
      case 127:
        const executable = builder.executable
        console.log(heredoc(`
          %cTeXification failed! Builder executable '${executable}' not found.

            latex.texPath
              as configured: ${atom.config.get('latex.texPath')}
              when resolved: ${builder.constructPath()}

          Make sure latex.texPath is configured correctly either adjust it \
          via the settings view, or directly in your config.cson file.
          `), 'color: red')
        break

      default:
        if (result && result.errors) {
          console.group(`TeXification failed with status code ${statusCode}`)
          for (const error of result.errors) {
            console.log(`%c${error.filePath}:${error.lineNumber}: ${error.message}`, 'color: red')
          }
          console.groupEnd()
        } else {
          console.log(`%cTeXification failed with status code ${statusCode}`, 'color: red')
        }
    }
    console.groupEnd()
  }

  warning (message) {
    console.group('LaTeX warnings')
    console.log(message)
    console.groupEnd()
  }
}
