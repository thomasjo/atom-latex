/** @babel */

import fs from 'fs-plus'
import temp from 'temp'
import path from 'path'
import ProcessManager from '../lib/process-manager'

describe('ProcessManager', () => {
  let processManager, tempPath

  function constructCommand (fileName) {
    const filePath = path.join(tempPath, fileName)
    return `latexmk -cd -f -pdf "${filePath}"`
  }

  beforeEach(() => {
    processManager = new ProcessManager()
    tempPath = fs.realpathSync(temp.mkdirSync('latex'))
    jasmine.Clock.useMock()
  })

  describe('ProcessManager', () => {
    it('kills latexmk when given non-existant file', () => {
      let killed = false

      processManager.exec(constructCommand('foo.tex')).then(result => {
        killed = true
      })
      processManager.kill()

      waitsFor(() => killed, 5000)
    })

    it('kills old latexmk instances, but not ones created after the kill command', () => {
      let oldKilled = false
      let newKilled = false

      processManager.exec(constructCommand('old.tex')).then(result => {
        oldKilled = true
      })
      processManager.kill()
      processManager.exec(constructCommand('new.tex')).then(result => {
        newKilled = true
      })

      waitsFor(() => oldKilled, 5000)

      runs(() => {
        expect(newKilled).toBe(false)
        processManager.kill()
      })
    })
  })
})
