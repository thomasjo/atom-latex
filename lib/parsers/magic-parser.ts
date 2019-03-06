import Parser from "../parser";

/* eslint-disable no-multi-spaces */

const MAGIC_COMMENT_PATTERN = new RegExp("" +
  "^%\\s*" +    // Optional whitespace.
  "!T[Ee]X" +   // Magic marker.
  "\\s+" +      // Semi-optional whitespace.
  "(\\w+)" +    // [1] Captures the magic keyword. E.g. 'root'.
  "\\s*=\\s*" + // Equal sign wrapped in optional whitespace.
  "(.*)" +      // [2] Captures everything following the equal sign.
  "$",           // EOL.
);

const LATEX_COMMAND_PATTERN = new RegExp("" +
  "\\" +                      // starting command \
  "\\w+" +                    // command name e.g. input
  "(\\{|\\w|\\}|/|\\]|\\[)*",  // options to the command
);

/* eslint-enable no-multi-spaces */

export default class MagicParser extends Parser {
  public parse() {
    const result: { [id: string]: any } = {};
    const lines = this.getLines([]);
    for (const line of lines) {
      const latexCommandMatch = line.match(LATEX_COMMAND_PATTERN);
      if (latexCommandMatch) { break; } // Stop parsing if a latex command was found

      const match = line.match(MAGIC_COMMENT_PATTERN);
      if (match !== null) {
        result[match[1]] = match[2].trim();
      }
    }

    return result;
  }
}
