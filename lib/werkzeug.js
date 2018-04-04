/** @babel */

import _ from 'lodash'
import url from 'url'

export default {
  pathToUri (filePath, hash) {
    if (process.platform === 'win32') {
      filePath = filePath.replace(/\\/g, '/')
      if (!filePath.startsWith('/')) {
        filePath = `/${filePath}`
      }
    }

    const urlObject = {
      protocol: 'file:',
      slashes: true,
      pathname: encodeURI(filePath).replace(/[?#]/g, encodeURIComponent)
    }

    if (hash) urlObject.hash = encodeURIComponent(hash)

    return url.format(urlObject)
  },

  uriToPath (uri) {
    let filePath = decodeURI(url.parse(uri).pathname || '')

    if (process.platform === 'win32') {
      filePath = filePath.replace(/\//g, '\\').replace(/^(.+)\|/, '$1:').replace(/\\([A-Z]:\\)/, '$1')
    } else if (!filePath.startsWith('/')) {
      filePath = `/${filePath}`
    }

    return filePath
  },

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

  isSourceFile (filePath) {
    return filePath && !!filePath.match(/\.(?:tex|tikz|lhs|lagda|[prs]nw)$/i)
  },

  isTexFile (filePath) {
    return filePath && !!filePath.match(/\.(?:tex|lhs|lagda)$/i)
  },

  isKnitrFile (filePath) {
    return filePath && !!filePath.match(/\.[rs]nw$/i)
  },

  isPdfFile (filePath) {
    return filePath && !!filePath.match(/\.pdf$/i)
  },

  isPsFile (filePath) {
    return filePath && !!filePath.match(/\.ps$/i)
  },

  isDviFile (filePath) {
    return filePath && !!filePath.match(/\.(?:dvi|xdv)$/i)
  }
}
