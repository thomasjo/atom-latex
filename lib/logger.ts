import _ from 'lodash'
// import React from 'react'
// import ReactDOM from 'react-dom'
import { CompositeDisposable, Disposable, Emitter } from 'atom'
// import { getEditorDetails } from './werkzeug'
import LogDock from './views/log-dock'

export default class Logger extends Disposable {
  disposables = new CompositeDisposable()
  emitter = new Emitter()
  loggingLevel: any
  container: HTMLDivElement
  messages: any[]

  constructor () {
    super(() => this.disposables.dispose())

    this.disposables.add(this.emitter)

    this.loggingLevel = atom.config.get('latex.loggingLevel')
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', () => {
      this.loggingLevel = atom.config.get('latex.loggingLevel')
      this.refresh()
    }))

    this.container = document.createElement('div')
    // this.disposables.add(atom.workspace.addOpener(uri => {
    //   if (uri === LogDock.LOG_DOCK_URI) {
    //     // return new LogDock()
    //     // ReactDOM.render(<LogDock />, this.container)
    //     return this.container.firstChild
    //   }
    // }))

    this.messages = []
  }

  onMessages (callback: any) {
    return this.emitter.on('messages', callback)
  }


  error (text: string, filePath?: string, range?: any, logPath?: any, logRange?: any) {
    this.showMessages([{ type: 'error', text, filePath, range, logPath, logRange }])
  }

  warning (text: string, filePath?: string, range?: any, logPath?: any, logRange?: any) {
    this.showMessages([{ type: 'warning', text, filePath, range, logPath, logRange }])
  }

  info (text: string, filePath?: string, range?: any, logPath?: any, logRange?: any) {
    this.showMessages([{ type: 'info', text, filePath, range, logPath, logRange }])
  }

  showMessages (messages: any[]) {
    messages = messages.map(message => _.pickBy(message))
    this.messages = this.messages.concat(messages)

    const filteredMessages = messages.filter(message => this.messageTypeIsVisible(message.type))

    if (filteredMessages.length > 0) {
      this.emitter.emit('messages', { messages: filteredMessages, reset: false })
    }
  }

  clear () {
    this.messages = []
    this.refresh()
  }

  refresh () {
    this.emitter.emit('messages', { messages: this.getMessages(), reset: true })
  }

  getMessages (useFilters = true) {
    return useFilters
      ? this.messages.filter(message => this.messageTypeIsVisible(message.type))
      : this.messages
  }

  setMessages (messages: any) {
    this.messages = messages
    this.emitter.emit('messages', { messages, reset: true })
  }

  messageTypeIsVisible (type: string) {
    return type === 'error' ||
      (this.loggingLevel !== 'error' && type === 'warning') ||
      (this.loggingLevel === 'info' && type === 'info')
  }

  async sync () {
    // FIXME: There should be no direct interaction with editors. The required
    //        values should be arguments.
    // const { filePath, position } = getEditorDetails()
    // if (filePath) {
    //   const logDock = await this.show()
    //   if (logDock) {
    //     // logDock.update({ filePath, position })
    //   }
    // }
  }

  async toggle () {
    return atom.workspace.toggle(LogDock.LOG_DOCK_URI)
  }

  async show () {
    return atom.workspace.open(LogDock.LOG_DOCK_URI)
  }

  async hide () {
    return atom.workspace.hide(LogDock.LOG_DOCK_URI)
  }
}
