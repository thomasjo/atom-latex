/** @babel */

import _ from 'lodash'

export default {
  heredoc (input) {
    if (input === null) { return null }

    const lines = _.dropWhile(input.split(/\r\n|\n|\r/), line => line.length === 0)
    const indentLength = _.takeWhile(lines[0], char => char === ' ').length
    const truncatedLines = lines.map(line => line.slice(indentLength))

    return truncatedLines.join('\n')
  },

  promisify (target) {
    return (...args) => {
      return new Promise((resolve, reject) => {
        target(...args, (error, data) => { error ? reject(error) : resolve(data) })
      })
    }
  },

  getEditorDetails () {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) return {}

    const filePath = editor.getPath()
    const position = editor.getCursorBufferPosition()
    const lineNumber = position.row + 1

    return { editor, filePath, position, lineNumber }
  },

  replacePropertiesInString (text, properties) {
    return _.reduce(properties, (current, value, name) => current.replace(`{${name}}`, value), text)
  },

  isPdfFile (filePath) {
    return filePath && !!filePath.match(/\.pdf$/i)
  },

  isPsFile (filePath) {
    return filePath && !!filePath.match(/\.ps/i)
  },

  isDviFile (filePath) {
    return filePath && !!filePath.match(/\.(?:dvi|xdv)$/i)
  }
}
