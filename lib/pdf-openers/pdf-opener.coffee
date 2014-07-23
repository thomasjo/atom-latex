MasterTexFinder = require '../master-tex-finder'
path = require 'path'

module.exports =
class PdfOpener
  open: (fileName) ->
    masterTexFinder = new MasterTexFinder(fileName.toString())
    masterTexPath = masterTexFinder.masterTexPath()
    masterBasename = path.basename(masterTexPath,'.tex')

    outdir = atom.config.get("latex.outputDirectory")
    if outdir?.length
      dir = path.dirname(masterTexPath)
      outdir = path.join(dir, outdir)

    pdfPath = path.join(outdir, masterBasename) + '.pdf'
    @callOpener(pdfPath)

  callOpener: (fname) ->
    throw "Implement this into subclasses"
