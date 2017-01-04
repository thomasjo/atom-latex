/** @babel */

export default class RuntimeComponent {
  async isAvailable () {
    return false
  }

  getPossiblePaths () {
    return []
  }

  async configurePath () {
    if (await this.isAvailable()) return

    const possiblePaths = this.getPossiblePaths()
    if (!possiblePaths || possiblePaths.length === 0) return

    const additionalPaths = atom.config.get('latex.additionalPaths')

    for (const possiblePath of possiblePaths) {
      atom.config.set('latex.additionalPaths', additionalPaths.concat(possiblePath))
      if (await this.isAvailable()) return
    }

    atom.config.set('latex.additionalPaths', additionalPaths)
  }
}
