/* @flow */

import childProcess from 'child_process'
import kill from 'tree-kill'
import type { ProcessResults } from './types'

export default class ProcessManager {
  processes: Set<number> = new Set()

  dispose (): void {
    this.killChildProcesses()
  }

  executeChildProcess (command: string, options: Object = {}): Promise<ProcessResults> {
    const { allowKill, showError, ...execOptions } = options
    return new Promise(resolve => {
      // Windows does not like \$ appearing in command lines so only escape
      // if we need to.
      if (process.platform !== 'win32') command = command.replace('$', '\\$')
      const { pid }: { pid: number } = childProcess.exec(command, execOptions, (error, stdout, stderr) => {
        if (allowKill) {
          this.processes.delete(pid)
        }
        if (error && showError && latex && latex.log) {
          latex.log.error(`An error occurred while trying to run "${command}" (${error.code}).`)
        }
        resolve({
          statusCode: error ? error.code : 0,
          stdout: stdout.toString(),
          stderr: stderr.toString()
        })
      })
      if (allowKill) {
        this.processes.add(pid)
      }
    })
  }

  killChildProcesses (): void {
    for (const pid: number of this.processes.values()) {
      kill(pid)
    }
    this.processes.clear()
  }
}
