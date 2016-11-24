/** @babel */

import fse from 'fs-extra'
import { promisify } from './werkzeug'

const SYNC_NAME_PATTERN = /(^[A-Z_]|[Ss]ync|walk)/

const exports = {}

for (const name in fse) {
  if (fse.hasOwnProperty(name)) {
    const fn = fse[name]
    exports[name] = SYNC_NAME_PATTERN.test(name) ? fn : promisify(fn)
  }
}

export default exports
