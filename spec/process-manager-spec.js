/** @babel */

import ProcessManager from '../lib/process-manager'

describe('ProcessManager', () => {
  let processManager

  beforeEach(() => {
    processManager = new ProcessManager()
    jasmine.Clock.useMock()
  })

  describe('ProcessManager', () => {
    it('kills latexmk when given non-existant file', () => {
      let killed
      processManager.exec('latexmk -f foo.tex').then(result => {
        killed = true
      })
      waitsFor(() => killed, 5000)
      processManager.kill()
    })
  })
})
