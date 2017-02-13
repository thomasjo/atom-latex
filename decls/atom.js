/* @flow */

declare var atom: Object;

declare module 'atom' {
  declare var BufferMarker: any;
  declare var CompositeDisposable: any;
  declare var Disposable: any;
  declare var Emitter: any;
  declare var Panel: any;
  declare var Point: any;
  declare var Range: any;
  declare var TextBuffer: any;
  declare var TextEditor: any;
  declare var TextEditorGutter: any;
  declare var TextEditorMarker: any;
}

declare module 'electron' {
  declare var shell: any;
}

declare function waitsForPromise(callback: (() => Promise<any>)): void;
