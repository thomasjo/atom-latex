/** @babel */

import fse from 'fs-extra'
import { promisify } from './werkzeug'

export default {
  copy: promisify(fse.copy),
  copySync: fse.copySync,
  realpathSync: fse.realpathSync
}
