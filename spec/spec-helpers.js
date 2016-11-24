/** @babel */

import fs from '../lib/fs'
import temp from 'temp'

export default {
  cloneFixtures () {
    const tempPath = fs.realpathSync(temp.mkdirSync('latex'))
    let fixturesPath = atom.project.getPaths()[0]
    fs.copySync(fixturesPath, tempPath)
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
  },

  activatePackages () {
    const workspaceElement = atom.views.getView(atom.workspace)
    const packages = ['language-latex', 'pdf-view', 'latex']
    const activationPromise = Promise.all(packages.map(pkg => atom.packages.activatePackage(pkg)))
    atom.commands.dispatch(workspaceElement, 'latex:sync')
    return activationPromise
  }
}
