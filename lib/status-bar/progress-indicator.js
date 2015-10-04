'use babel'
/** @jsx etch.dom */

import etch from 'etch'

export default class ProgressIndicator {
  constructor () {
    etch.createElement(this)
  }

  render () {
    return (
      <div className='latex-progress-indicator inline-block'>
        <span className='inline-block'>Compiling TeX file</span>
        <span className='dot one'>.</span>
        <span className='dot two'>.</span>
        <span className='dot three'>.</span>
      </div>
    )
  }
}
