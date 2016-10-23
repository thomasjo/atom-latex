/** @babel */

import childProcess from 'child_process'
import kill from 'tree-kill'
import _ from 'lodash'

export default class ProcessManager {
  processes = new Set()

  executeChildProcess (command, options = {}) {
    const { allowKill, showError } = options
    options = _.omit(options, 'allowKill', 'showError')
    return new Promise((resolve) => {
      // Windows does not like \$ appearing in command lines so only escape
      // if we need to.
      if (process.platform !== 'win32') command = command.replace('$', '\\$')
      const { pid } = childProcess.exec(command, options, (error, stdout, stderr) => {
        if (allowKill) {
          this.processes.delete(pid)
        }
        if (error && showError) {
          latex.log.error(`An error occured while trying to run "${command}" (${error.code}).`)
        }
        resolve({
          statusCode: error ? error.code : 0,
          stdout,
          stderr
        })
      })
      if (allowKill) {
        this.processes.add(pid)
      }
    })
  }

  killChildProcesses () {
    for (const pid of this.processes.values()) {
      kill(pid)
    }
    this.processes.clear()
  }
}
