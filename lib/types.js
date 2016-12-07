/* @flow */

import { Range } from 'atom'

export type LogMessage = {
  type: 'info'|'warning'|'error',
  text: string,
  filePath: ?string,
  range: ?Range,
  logPath: ?string,
  logRange: ?Range
}
