/** @babel */

import childProcess from 'child_process'
import _ from 'lodash'

export default class DiagnosticsReport {
  constructor () {
    this.summary = 'Detailed Markdown formatted diagnostics placed on clipboard.\n\n'
    this.detailed = '# Detailed LaTeX Diagnostics\n\n'
  }

  addSection (title) {
    this.detailed += `## ${title}\n\n`
  }

  addSubSection (title) {
    this.detailed += `### ${title}\n\n`
  }

  addSummary (text, includeDetailed) {
    this.summary += text
    if (includeDetailed) this.detailed += text + '\n'
  }

  addCodeBlock (text, grammar) {
    this.detailed += grammar ? `\`\`\`${grammar}\n` : '```\n'
    this.detailed += text + (_.endsWith(text, '\n') ? '' : '\n') + '```\n'
  }

  addJsonBlock (value) {
    this.addCodeBlock(JSON.stringify(value, null, 2), 'json')
  }

  addDetailed (text) {
    this.detailed += text + '\n'
  }

  addProperty (name, value) {
    this.detailed += `${name}: ${value}\n`
  }

  exec (title, command, options) {
    return new Promise((resolve) => {
      childProcess.exec(command, options || {}, (error, stdout, stderr) => {
        this.addSection(title)
        if (error) {
          this.addSummary(`\`${command}\` execution failed with a status code of ${error.code}.\n`, true)
        } else {
          this.addSummary(`\`${command}\` execution succeeded.\n`, true)
        }
        if (stderr) {
          this.addSubSection('stderr')
          this.addCodeBlock(stderr)
        }
        if (stdout) {
          this.addSubSection('stdout')
          this.addCodeBlock(stdout)
        }
        resolve()
      })
    })
  }

  report () {
    atom.clipboard.write(this.detailed)
    atom.notifications.addInfo('LaTeX diagnostics completed', { detail: this.summary })
  }
}
