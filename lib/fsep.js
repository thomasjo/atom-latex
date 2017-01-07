/** @babel */

import fse from 'fs-extra'
import { promisify } from './werkzeug'

const SYNC_NAME_PATTERN = /(^[A-Z_]|[Ss]ync)/

const exports = {}

for (const name in fse) {
  if (fse.hasOwnProperty(name)) {
    const fn = fse[name]
    if (name === 'walk') {
      exports[name] = (directoryPath) => new Promise((resolve, reject) => {
        const items = []
        fn(directoryPath)
          .on('data', item => items.push(item))
          .on('end', () => resolve(items))
          .on('error', error => reject(error))
      })
    } else if (SYNC_NAME_PATTERN.test(name)) {
      exports[name] = fn
    } else {
      exports[name] = promisify(fn)
    }
  }
}

export default exports
