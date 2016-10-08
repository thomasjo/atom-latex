/** @babel */

import childProcess from 'child_process'
import kill from 'tree-kill'

export default class ProcessManager {
  processes = new Set()

  executeChildProcess (command, options) {
    return new Promise((resolve) => {
      const { pid } = childProcess.exec(command, options, (error, stdout, stderr) => {
        this.processes.delete(pid)
        resolve({
          statusCode: error ? error.code : 0,
          stdout,
          stderr
        })
      })
      this.processes.add(pid)
    })
  }

  killChildProcesses () {
    for (const pid of this.processes.values()) {
      kill(pid)
    }
    this.processes.clear()
  }
}
