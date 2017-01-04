/** @babel */

export default class RuntimeComponent {
  available = false

  isAvailable () {
    return this.available
  }

  setAvailability (available) {
    this.available = available
  }

  async checkAvailability () {}

  getPossiblePaths () {
    return []
  }

  async configurePath () {
    const name = this.constructor.name

    await this.checkAvailability()
    if (this.isAvailable()) {
      latex.log.info(`Runtime component ${name} dependencies found.`)
      return
    }

    const possiblePaths = this.getPossiblePaths()
    if (!possiblePaths || possiblePaths.length === 0) return

    latex.log.info(`Searching for dependencies of runtime component ${name}.`)

    const additionalPaths = atom.config.get('latex.additionalPaths')

    for (const possiblePath of possiblePaths) {
      latex.log.info(`Looking in path "${possiblePath}" for dependencies.`)
      atom.config.set('latex.additionalPaths', additionalPaths.concat(possiblePath))
      await this.checkAvailability()
      if (this.isAvailable()) {
        latex.log.info(`Dependencies found. Path "${possiblePath}" added to additionalPaths setting.`)
        return
      }
    }

    atom.config.set('latex.additionalPaths', additionalPaths)
    latex.log.info(`Runtime component ${name} dependencies were not found.`)
  }
}
