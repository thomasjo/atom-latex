MasterTexFinder = require '../master-tex-finder'
path = require 'path'

module.exports =
class PdfOpener
  open: (fileName) ->
    masterTexFinder = new MasterTexFinder(fileName.toString())
    masterTexPaths = masterTexFinder.masterTexPath()

    if masterTexPaths.length != 1
      console.warn('No (or more than one) master tex path found')
      return

    masterTexPath = masterTexPaths[0]
    masterDirPath = path.dirname(masterTexPath)
    masterBasename = path.basename(masterTexPath,'.tex')
    pdfPath = path.join(masterDirPath, masterBasename) + '.pdf'
    @callOpener(pdfPath)

  callOpener: (fname) ->
    throw "Implement this into subclasses"
