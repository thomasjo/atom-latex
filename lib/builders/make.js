/** @babel */

import path from 'path'
import fs from 'fs'
import Builder from '../builder'

const DEFAULT_MAKEFILE = 'Makefile'

export default class MakeBuilder extends Builder {
  executable = 'make'

  static canProcess (filePath) {
    return fs.existsSync(path.join(path.dirname(filePath), DEFAULT_MAKEFILE))
  }

  async run (filePath, jobname, shouldRebuild) {
    const args = this.constructArgs(filePath, jobname, shouldRebuild)
    const command = `${this.executable} ${args.join(' ')}`
    const options = this.constructChildProcessOptions(filePath, { max_print_line: 1000 })

    const { statusCode } = await latex.process.executeChildProcess(command, options)
    return statusCode
  }

  logStatusCode (statusCode) {
    switch (statusCode) {
      case 2:
        latex.log.error('make: failed. See log for details.')
        break
      default:
        super.logStatusCode(statusCode)
    }
  }

  constructArgs (filePath, jobname, shouldRebuild) {
    const args = []

    // Support standard targets (i.e. all, clean, distclean)
    // https://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets

    if (shouldRebuild) {
      args.push('clean')
    }
    args.push('all')

    return args
  }
}
