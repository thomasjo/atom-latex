import { exec } from 'child_process'
import kill from 'tree-kill'
import { Disposable } from 'atom'

interface ProcessResult {
  statusCode: number
  stdout?: string
  stderr?: string
}

interface ProcessOptions {
  allowKill?: boolean
  showError?: boolean
  encoding?: string
  maxBuffer?: number
  cwd?: string
  env?: any
}

export default class ProcessManager extends Disposable {
  processes = new Set()

  constructor () {
    super(() => this.killChildProcesses())
  }

  async executeChildProcess (command: string, options?: ProcessOptions) {
    if (!options) {
      options = { allowKill: false, showError: false }
    }

    const { allowKill, showError, ...execOptions } = options

    // Windows does not like \$ appearing in command lines so only escape if we need to.
    if (process.platform !== 'win32') {
      command = command.replace('$', '\\$')
    }

    const promise: Promise<ProcessResult> = new Promise((resolve) => {
      const { pid } = exec(command, execOptions, (error, stdout, stderr) => {
        let statusCode = 0

        if (error) {
          statusCode = error.code!

          if (showError && latex && latex.log) {
            latex.log.error(`An error occurred while trying to run "${command}" (${error.code}).`)
          }
        }

        resolve({
          statusCode,
          stdout: stdout.toString(),
          stderr: stderr.toString()
        })
      })

      if (allowKill) {
        this.processes.add(pid)
      }
    })

    return promise
  }

  killChildProcesses () {
    for (const pid of this.processes.values()) {
      kill(pid)
    }

    this.processes.clear()
  }
}
