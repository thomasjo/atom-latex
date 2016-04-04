'use babel'

import _ from 'lodash'

export function heredoc (input) {
  if (input === null) { return null }

  const allLines = input.split(/\r\n|\n|\r/)
  const lines = _.dropWhile(allLines, line => line.length === 0)
  const indentLength = _.takeWhile(lines[0], char => char === ' ').length
  const truncatedLines = lines.map(line => line.slice(indentLength))

  return truncatedLines.join('\n')
}
