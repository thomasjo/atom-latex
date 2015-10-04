'use babel'

import fs from 'fs-plus'
import path from 'path'
import MagicParser from './parsers/magic-parser'

const masterFilePattern = new RegExp('' +
  '^\\s*' +             // Optional whitespace.
  '\\\\documentclass' + // Command.
  '(\\[.*\\])?' +       // Optional command options.
  '\\{.*\\}'            // Class name.
)

export default class MasterTexFinder {
  // Create a new MasterTexFinder.
  // this.param filePath: a file name in the directory to be searched
  constructor (filePath) {
    this.filePath = filePath
    this.fileName = path.basename(filePath)
    this.projectPath = path.dirname(filePath)
  }

  // Returns the list of tex files in the project directory
  getTexFilesList () {
    return fs.listSync(this.projectPath, ['.tex'])
  }

  // Returns true iff path is a master file (contains the documentclass declaration)
  isMasterFile (filePath) {
    if (!fs.existsSync(filePath)) { return false }

    const rawFile = fs.readFileSync(filePath, {encoding: 'utf-8'})
    return masterFilePattern.test(rawFile)
  }

  // Returns an array containing the path to the root file indicated by a magic
  // comment in this.filePath.
  // Returns null if no magic comment can be found in this.filePath.
  getMagicCommentMasterFile () {
    const magic = new MagicParser(this.filePath).parse()
    if (!magic || !magic.root) { return null }
    return path.resolve(this.projectPath, magic.root)
  }

  // Returns the list of tex files in the directory where this.filePath lives that
  // contain a documentclass declaration.
  searchForMasterFile () {
    const files = this.getTexFilesList()
    if (!files) { return null }
    if (files.length === 0) { return this.filePath }
    if (files.length === 1) { return files[0] }

    const result = files.filter(p => this.isMasterFile(p))
    if (result.length === 1) { return result[0] }

    // TODO: Nuke warning?
    latex.log.warning('Cannot find latex master file')
    return this.filePath
  }

  // Returns the a latex master file.
  //
  // If this.filePath contains a magic comment uses that comment to determine the master file.
  // Else if master file search is disabled, returns this.filePath.
  // Else if the this.filePath is itself a master file, returns this.filePath.
  // Otherwise it searches the directory where this.filePath is contained for files having a
  //   'documentclass' declaration.
  getMasterTexPath () {
    const masterPath = this.getMagicCommentMasterFile()
    if (masterPath) { return masterPath }
    if (!this.isMasterFileSearchEnabled()) { return this.filePath }
    if (this.isMasterFile(this.filePath)) { return this.filePath }

    return this.searchForMasterFile()
  }

  isMasterFileSearchEnabled () { return atom.config.get('latex.useMasterFileSearch') }
}
