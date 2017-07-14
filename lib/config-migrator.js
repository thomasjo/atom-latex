/** @babel */

import { shell } from 'electron'
import _ from 'lodash'
import { heredoc } from './werkzeug'

export default function checkConfigAndMigrate () {
  // TODO: remove after grace period
  checkCleanExtensions()
  checkOpenerSetting()
  checkMasterFileSearchSetting()
  checkBuilder()
}

function checkBuilder () {
  const builder = atom.config.get('latex.builder')
  if (!builder) return

  atom.config.unset('latex.builder')
  if (builder !== 'texify') return

  // --------------------------------------------------
  // TODO: Remove this whole block after a grace period
  // --------------------------------------------------
  const message = `LaTeX: The texify builder has been deprecated`
  const description = heredoc(`
    Support for the \`texify\` builder has been deprecated in favor of \`latexmk\`,
    and has been removed.`)

  const title = 'How to use latexmk with MiKTeX'
  const url = 'https://github.com/thomasjo/atom-latex/wiki/Using-latexmk-with-MiKTeX'
  const openUrl = (event) => {
    // NOTE: Horrible hack due to a bug in atom/notifications module...
    const element = event.target.parentElement.parentElement.parentElement.parentElement
    const notification = element.getModel()
    notification.dismiss()

    shell.openExternal(url)
  }

  atom.notifications.addWarning(message, {
    dismissable: true, description, buttons: [{ text: title, onDidClick: openUrl }]
  })
}

function checkMasterFileSearchSetting () {
  if (!atom.config.get('latex.useMasterFileSearch')) return

  atom.config.unset('latex.useMasterFileSearch')

  const message = `LaTeX: The Master File Search setting has been deprecated`
  const description = heredoc(`
    Support for the Master File Search setting has been deprecated in favor of
    \`%!TEX root\` magic comments, and has been removed.`)
  atom.notifications.addInfo(message, { description })
}

function checkCleanExtensions () {
  const cleanExtensions = atom.config.get('latex.cleanExtensions')
  if (!cleanExtensions) return

  let cleanPatterns = atom.config.get('latex.cleanPatterns')
  const defaultExtensions = [
    '.aux', '.bbl', '.blg', '.fdb_latexmk', '.fls', '.lof', '.log',
    '.lol', '.lot', '.nav', '.out', '.pdf', '.snm', '.synctex.gz', '.toc'
  ]

  atom.config.unset('latex.cleanExtensions')

  const removedExtensions = _.difference(defaultExtensions, cleanExtensions)
  cleanPatterns = _.difference(cleanPatterns, removedExtensions.map(extension => `**/*${extension}`))

  const addedExtensions = _.difference(cleanExtensions, defaultExtensions)
  cleanPatterns = _.union(cleanPatterns, addedExtensions.map(extension => `**/*${extension}`))

  atom.config.set('latex.cleanPatterns', cleanPatterns)
  const message = 'LaTeX: The "latex:clean" command has changed'
  const description = heredoc(`
    Your custom extensions in the \`Clean Extensions\` settings have
    been migrated to the new setting \`Clean Patterns\`.`)
  atom.notifications.addInfo(message, { description })
}

function checkOpenerSetting () {
  const alwaysOpenResultInAtom = atom.config.get('latex.alwaysOpenResultInAtom')
  if (!alwaysOpenResultInAtom) return

  atom.config.unset('latex.alwaysOpenResultInAtom')
  atom.config.set('latex.opener', 'pdf-view')
}
