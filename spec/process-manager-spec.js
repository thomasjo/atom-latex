/** @babel */

import fs from 'fs-plus'
import temp from 'temp'
import path from 'path'
import ProcessManager from '../lib/process-manager'

describe('ProcessManager', () => {
  let processManager

  function constructCommand (fileName) {
    const tempPath = fs.realpathSync(temp.mkdirSync('latex'))
    const filePath = path.join(tempPath, fileName)
    return `latexmk -cd -f -pdf "${filePath}"`
  }

  beforeEach(() => {
    processManager = new ProcessManager()
  })

  describe('ProcessManager', () => {
    it('kills latexmk when given non-existant file', () => {
      let killed = false

      processManager.executeChildProcess(constructCommand('foo.tex'), { allowKill: true }).then(result => { killed = true })
      processManager.killChildProcesses()

      waitsFor(() => killed, 5000)
    })

    it('kills old latexmk instances, but not ones created after the kill command', () => {
      let oldKilled = false
      let newKilled = false

      processManager.executeChildProcess(constructCommand('old.tex'), { allowKill: true }).then(result => { oldKilled = true })
      processManager.killChildProcesses()
      processManager.executeChildProcess(constructCommand('new.tex'), { allowKill: true }).then(result => { newKilled = true })

      waitsFor(() => oldKilled, 5000)

      runs(() => {
        expect(newKilled).toBe(false)
        processManager.killChildProcesses()
      })
    })
  })
})
