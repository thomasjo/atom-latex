'use babel'

import './spec-bootstrap'

import fs from 'fs-plus'
import temp from 'temp'
import wrench from 'wrench'

export default {
  cloneFixtures () {
    const tempPath = fs.realpathSync(temp.mkdirSync('latex'))
    let fixturesPath = atom.project.getPaths()[0]
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, {forceDelete: true})
    atom.project.setPaths([tempPath])
    fixturesPath = tempPath

    return fixturesPath
  },

  overridePlatform (name) {
    Object.defineProperty(process, 'platform', {__proto__: null, value: name})
  },

  setTimeoutInterval (interval) {
    const env = jasmine.getEnv()
    const originalInterval = env.defaultTimeoutInterval
    env.defaultTimeoutInterval = interval

    return originalInterval
  }
}
