'use babel'

import '../spec-helpers'

import path from 'path'
import LogParser from '../../lib/parsers/log-parser'

describe('LogParser', () => {
  let fixturesPath

  beforeEach(() => {
    fixturesPath = atom.project.getPaths()[0]
  })

  describe('parse', () => {
    it('returns the expected output path', () => {
      const logFile = path.join(fixturesPath, 'file.log')
      const parser = new LogParser(logFile)
      const result = parser.parse()
      const outputFilePath = path.posix.resolve(result.outputFilePath)

      expect(outputFilePath).toBe('/foo/output/file.pdf')
    })

    it('returns the expected output path when the compiled file contained spaces', () => {
      const logFile = path.join(fixturesPath, 'filename with spaces.log')
      const parser = new LogParser(logFile)
      const result = parser.parse()
      const outputFilePath = path.posix.resolve(result.outputFilePath)

      expect(outputFilePath).toBe('/foo/output/filename with spaces.pdf')
    })

    it('parses and returns all errors', () => {
      const logFile = path.join(fixturesPath, 'errors.log')
      const parser = new LogParser(logFile)
      const result = parser.parse()

      expect(result.errors.length).toBe(3)
    })

    it('associates an error with a file path, line number, and message', () => {
      const logFile = path.join(fixturesPath, 'errors.log')
      const parser = new LogParser(logFile)
      const result = parser.parse()
      const error = result.errors[0]

      expect(error).toEqual({
        logPosition: [196, 0],
        filePath: 'errors.tex',
        lineNumber: 10,
        message: '\\begin{gather*} on input line 8 ended by \\end{gather}'
      })
    })
  })

  describe('getLines', () => {
    it('returns the expected number of lines', () => {
      const logFile = path.join(fixturesPath, 'file.log')
      const parser = new LogParser(logFile)
      const lines = parser.getLines()

      expect(lines.length).toBe(63)
    })

    it('throws an error when passed a filepath that does not exist', () => {
      const logFile = path.join(fixturesPath, 'nope.log')
      const parser = new LogParser(logFile)

      expect(parser.getLines).toThrow()
    })
  })
})
