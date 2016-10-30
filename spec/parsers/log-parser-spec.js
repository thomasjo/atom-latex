/** @babel */

import '../spec-helpers'

import _ from 'lodash'
import path from 'path'
import LogParser from '../../lib/parsers/log-parser'

describe('LogParser', () => {
  let fixturesPath

  beforeEach(() => {
    fixturesPath = atom.project.getPaths()[0]
  })

  describe('parse', () => {
    it('returns the expected output path', () => {
      const expectedPath = path.resolve('/foo/output/file.pdf')
      const logFile = path.join(fixturesPath, 'file.log')
      const texFile = path.join(fixturesPath, 'file.tex')
      const parser = new LogParser(logFile, texFile)
      const result = parser.parse()

      expect(result.outputFilePath).toBe(expectedPath)
    })

    it('returns the expected output path when the compiled file contained spaces', () => {
      const expectedPath = path.resolve('/foo/output/filename with spaces.pdf')
      const logFile = path.join(fixturesPath, 'filename with spaces.log')
      const texFile = path.join(fixturesPath, 'filename with spaces.tex')
      const parser = new LogParser(logFile, texFile)
      const result = parser.parse()

      expect(result.outputFilePath).toBe(expectedPath)
    })

    it('parses and returns all errors', () => {
      const logFile = path.join(fixturesPath, 'errors.log')
      const texFile = path.join(fixturesPath, 'errors.tex')
      const parser = new LogParser(logFile, texFile)
      const result = parser.parse()

      expect(_.countBy(result.messages, 'type').error).toBe(3)
    })

    it('associates an error with a file path, line number, and message', () => {
      const logFile = path.join(fixturesPath, 'errors.log')
      const texFile = path.join(fixturesPath, 'errors.tex')
      const parser = new LogParser(logFile, texFile)
      const result = parser.parse()
      const error = result.messages.find(message => { return message.type === 'error' })

      expect(error).toEqual({
        type: 'error',
        logRange: [[196, 0], [196, 84]],
        filePath: texFile,
        range: [[9, 0], [9, 65536]],
        logPath: logFile,
        text: '\\begin{gather*} on input line 8 ended by \\end{gather}'
      })
    })
  })

  describe('getLines', () => {
    it('returns the expected number of lines', () => {
      const logFile = path.join(fixturesPath, 'file.log')
      const texFile = path.join(fixturesPath, 'file.tex')
      const parser = new LogParser(logFile, texFile)
      const lines = parser.getLines()

      expect(lines.length).toBe(63)
    })

    it('throws an error when passed a filepath that does not exist', () => {
      const logFile = path.join(fixturesPath, 'nope.log')
      const texFile = path.join(fixturesPath, 'nope.tex')
      const parser = new LogParser(logFile, texFile)

      expect(parser.getLines).toThrow()
    })
  })
})
