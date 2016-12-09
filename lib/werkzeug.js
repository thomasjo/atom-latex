/* @flow */

import _ from 'lodash'
import type { EditorDetails } from './types'

export function heredoc (input: ?string): ?string {
  if (!input) { return input }

  const lines = _.dropWhile(input.split(/\r\n|\n|\r/), line => line.length === 0)
  const indentLength = _.takeWhile(lines[0], char => char === ' ').length
  const truncatedLines = lines.map(line => line.slice(indentLength))

  return truncatedLines.join('\n')
}

export function promisify (target: Function) {
  return (...args: any) => {
    return new Promise((resolve, reject) => {
      target(...args, (error, data) => { error ? reject(error) : resolve(data) })
    })
  }
}

export function getEditorDetails (): EditorDetails {
  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) return {}

  const filePath = editor.getPath()
  const position = editor.getCursorBufferPosition()
  const lineNumber = position.row + 1

  return { editor, filePath, position, lineNumber }
}

export function replacePropertiesInString (text: string, properties: Object) {
  return _.reduce(properties, (current, value, name) => current.replace(`{${name}}`, value), text)
}

export function isTexFile (filePath: string): boolean {
  return !!filePath.match(/\.(?:tex|lhs)$/i)
}

export function isKnitrFile (filePath: string): boolean {
  return !!filePath.match(/\.[rs]nw$/i)
}

export function isPdfFile (filePath: string): boolean {
  return !!filePath.match(/\.pdf$/i)
}

export function isPsFile (filePath: string): boolean {
  return !!filePath.match(/\.ps/i)
}

export function isDviFile (filePath: string): boolean {
  return !!filePath.match(/\.(?:dvi|xdv)$/i)
}
