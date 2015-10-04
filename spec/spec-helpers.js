'use babel'

import './spec-bootstrap'

import _ from 'lodash'
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

  spyOnConfig (key, value) {
    const get = atom.config.get
    if (!jasmine.isSpy(get)) {
      spyOn(atom.config, 'get').andCallFake(requestedKey => {
        const fakeValue = _.get(atom.config.get.values, requestedKey, null)
        if (fakeValue !== null) { return fakeValue }
        return get.call(atom.config, requestedKey)
      })

      atom.config.get.values = {}
    }

    atom.config.get.values[key] = value
  },

  setTimeoutInterval (interval) {
    const env = jasmine.getEnv()
    const originalInterval = env.defaultTimeoutInterval
    env.defaultTimeoutInterval = interval

    return originalInterval
  }
}
