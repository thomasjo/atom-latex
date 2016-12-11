/* @flow */

import Parser from '../parser.js'

const MAGIC_COMMENT_PATTERN = new RegExp('' +
  '^%\\s*' +    // Optional whitespace.
  '!T[Ee]X' +   // Magic marker.
  '\\s+' +      // Semi-optional whitespace.
  '(\\w+)' +    // [1] Captures the magic keyword. E.g. 'root'.
  '\\s*=\\s*' + // Equal sign wrapped in optional whitespace.
  '(.*)' +      // [2] Captures everything following the equal sign.
  '$'           // EOL.
)

const LATEX_COMMAND_PATTERN = new RegExp('' +
  '\\' +                      // starting command \
  '\\w+' +                    // command name e.g. input
  '(\\{|\\w|\\}|/|\\]|\\[)*'  // options to the command
)

export default class MagicParser extends Parser {
  parse (): ?Object {
    const result: Object = {}
    const lines: Array<string> = this.getLines([])
    for (const line: string of lines) {
      const latexCommandMatch: ?Array<string> = line.match(LATEX_COMMAND_PATTERN)
      if (latexCommandMatch) { break } // Stop parsing if a latex command was found

      const match: ?Array<string> = line.match(MAGIC_COMMENT_PATTERN)
      if (match != null) {
        result[match[1]] = match[2].trim()
      }
    }

    return result
  }
}
