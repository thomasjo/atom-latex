/* @flow */

import _ from 'lodash'
import type { Point, TextEditor } from 'atom'
import type { EditorDetails } from './types'

const INDENT_PATTERN = /^[\n\r]*( +)/

export default {
  heredoc (input: ?string): ?string {
    if (!input) { return input }

    const indentMatch: ?Array<string> = input.match(INDENT_PATTERN)
    if (indentMatch) {
      input = input.replace(new RegExp(`^${indentMatch[1]}`, 'gm'), '')
    }
    return input.trim()
  },

  promisify (target: Function): Function {
    return (...args: any) => {
      return new Promise((resolve, reject) => {
        target(...args, (error, data) => { error ? reject(error) : resolve(data) })
      })
    }
  },

  getEditorDetails (): EditorDetails {
    const editor: ?TextEditor = atom.workspace.getActiveTextEditor()
    if (!editor) return {}

    const filePath: string = editor.getPath()
    const position: Point = editor.getCursorBufferPosition()
    const lineNumber: number = position.row + 1

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
