module.exports =
class PdfOpener
  # Opens the given pdf file using an external viewer. This method is async.
  #
  # @param fileName: the file to be opened
  # @param error: (optional) a function taking the error structure (as returned
  #   by child_process#exec) and the stderr of the child process and
  #   handling the error report to the user
  # @param next: (optional) a function that will be called if the opening is successful
  open: (filePath, callback) -> undefined
