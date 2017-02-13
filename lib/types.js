/* @flow */

import { TextEditor, Point, Range } from 'atom'

export type LogMessage = {
  type: 'info' | 'warning' | 'error',
  text: string,
  filePath?: string,
  range?: Range,
  logPath?: string,
  logRange?: Range
}

export type EditorDetails = {
  editor?: TextEditor,
  filePath?: string,
  position?: Point,
  lineNumber?: number
}

export type ProcessResults = {
  statusCode: number,
  stdout: string,
  stderr: string
}

export type DbusNames = {
  applicationObject: string,
  applicationInterface: string,
  daemonService: string,
  daemonObject: string,
  daemonInterface: string,
  windowInterface: string,
  fdApplicationObject?: string,
  fdApplicationInterface?: string
}

export type UnaryFunction = (value: any) => {}
