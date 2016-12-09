/* @flow */

import _ from 'lodash'
import type { EditorDetails } from './types'

export default {
  heredoc (input: ?string): ?string {
    if (!input) { return input }

    const lines = _.dropWhile(input.split(/\r\n|\n|\r/), line => line.length === 0)
    const indentLength = _.takeWhile(lines[0], char => char === ' ').length
    const truncatedLines = lines.map(line => line.slice(indentLength))

    return truncatedLines.join('\n')
  },

  promisify (target: Function): Function {
    return (...args: any) => {
      return new Promise((resolve, reject) => {
        target(...args, (error, data) => { error ? reject(error) : resolve(data) })
      })
    }
  },

  getEditorDetails (): EditorDetails {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) return {}

    const filePath = editor.getPath()
    const position = editor.getCursorBufferPosition()
    const lineNumber = position.row + 1

    return { editor, filePath, position, lineNumber }
  },

  replacePropertiesInString (text: string, properties: Object): string {
    return _.reduce(properties, (current, value, name) => current.replace(`{${name}}`, value), text)
  },

  isTexFile (filePath: string): boolean {
    return !!filePath.match(/\.(?:tex|lhs)$/i)
  },

  isKnitrFile (filePath: string): boolean {
    return !!filePath.match(/\.[rs]nw$/i)
  },

  isPdfFile (filePath: string): boolean {
    return !!filePath.match(/\.pdf$/i)
  },

  isPsFile (filePath: string): boolean {
    return !!filePath.match(/\.ps/i)
  },

  isDviFile (filePath: string): boolean {
    return !!filePath.match(/\.(?:dvi|xdv)$/i)
  }
}
