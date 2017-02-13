/* @flow */

import fs from 'fs-plus'
import temp from 'temp'
import wrench from 'wrench'

export default {
  cloneFixtures (): string {
    const tempPath = fs.realpathSync(temp.mkdirSync('latex'))
    let fixturesPath = atom.project.getPaths()[0]
    wrench.copyDirSyncRecursive(fixturesPath, tempPath, {forceDelete: true})
    atom.project.setPaths([tempPath])
    fixturesPath = tempPath

    return fixturesPath
  },

  overridePlatform (name: string) {
    Object.defineProperty(process, 'platform', {__proto__: null, value: name})
  },

  setTimeoutInterval (interval: number): number {
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
