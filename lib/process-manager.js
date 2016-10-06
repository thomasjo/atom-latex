/** @babel */

import _ from 'lodash'
import childProcess from 'child_process'
import kill from 'tree-kill'
import { promisify } from './werkzeug'

const killTree = promisify(kill)

export default class ProcessManager {
  processes = new Set()

  exec (command, options) {
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

  async kill () {
    await Promise.all(_.map(this.processes.values(), pid => killTree(pid)))
    this.processes.clear()
  }
}

