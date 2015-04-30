"use babel";

import _ from "lodash";

export function heredoc(input) {
  const lines = _.dropWhile(input.split(/\r\n|\n|\r/), line => line.length === 0);
  const indentLength = _.takeWhile(lines[0], char => char === " ").length;
  const truncatedLines = _.map(lines, line => line.slice(indentLength));

  return truncatedLines.join("\n");
}
