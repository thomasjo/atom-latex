/** @babel */

import childProcess from 'child_process'
import kill from 'tree-kill'

export default class ProcessManager {
  processes = new Set()

  exec (command, options) {
    return new Promise((resolve) => {
      const proc = childProcess.exec(command, options, (error, stdout, stderr) => {
        this.processes.delete(proc.pid)
        resolve({
          statusCode: error ? error.code : 0,
          stdout,
          stderr
        })
      })
      this.processes.add(proc.pid)
    })
  }

  kill () {
    for (const pid of this.processes.values()) {
      kill(pid)
    }
    this.processes.clear()
  }
}

