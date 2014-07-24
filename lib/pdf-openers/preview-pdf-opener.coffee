PdfOpener = require './pdf-opener'
{exec} = require 'child_process'


module.exports =
class PreviewPdfOpener extends PdfOpener
  callOpener: (fname) ->
    console.log("open -a Preview "+fname)
    exec "open -a Preview "+fname, (error, stdout, stderr) ->
      if error?
        console.error('Error opening file:'+fname+' reason:'+error)
