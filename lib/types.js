/* @flow */

import { TextEditor, Point, Range } from 'atom'

export type LogMessage = {
  type: 'info'|'warning'|'error',
  text: string,
  filePath: ?string,
  range: ?Range,
  logPath: ?string,
  logRange: ?Range
}

export type EditorDetails = {
  editor?: TextEditor,
  filePath?: string,
  position?: Point,
  lineNumber?: number
}

export type ProcessResults = {
  statusCode: number,
  stdout: string|Buffer,
  stderr: string|Buffer
}
