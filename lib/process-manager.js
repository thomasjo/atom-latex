/** @babel */

import childProcess from 'child_process'
import path from 'path'
import kill from 'tree-kill'
import { Disposable } from 'atom'

export default class ProcessManager extends Disposable {
  processes = new Set()
  envPathKey = this.getEnvironmentPathKey(process.platform)

  constructor () {
    super(() => this.killChildProcesses())
  }

  executeChildProcess (command, options = {}) {
    const { allowKill, showError, env, ...execOptions } = options
    execOptions.env = this.constructEnvironment(env)
    return new Promise(resolve => {
      // Windows does not like \$ appearing in command lines so only escape
      // if we need to.
      if (process.platform !== 'win32') command = command.replace('$', '\\$')
      const { pid } = childProcess.exec(command, execOptions, (error, stdout, stderr) => {
        if (allowKill) {
          this.processes.delete(pid)
        }
        if (error && showError && latex && latex.log) {
          latex.log.error(`An error occurred while trying to run "${command}" (${error.code}).`)
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

  getEnvironmentPathKey (platform) {
    if (platform === 'win32') { return 'Path' }
    return 'PATH'
  }

  constructEnvironment (defaultEnv) {
    const env = Object.assign({}, process.env, defaultEnv || {})

    env[this.envPathKey] = this.constructPath()

    return env
  }

  constructPath () {
    const additionalPaths = atom.config.get('latex.additionalPaths')
    const processPath = process.env[this.envPathKey]

    return [processPath].concat(additionalPaths).join(path.delimiter)
  }

  killChildProcesses () {
    for (const pid of this.processes.values()) {
      kill(pid)
    }
    this.processes.clear()
  }
}
