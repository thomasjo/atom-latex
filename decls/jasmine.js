/* @flow */

declare var jasmine: Object;

declare function afterEach(callback: (() => void)): void;
declare function beforeEach(callback: (() => void)): void;
declare function describe(name: string, callback: (() => void)): void;
declare function expect(value: any): Object;
declare function describe(name: string, callback: (() => void)): void;
declare function fit(name: string, callback: (() => void)): void;
declare function it(name: string, callback: (() => void)): void;
declare function spyOn(object: Object, property: string): Object;
declare function waitsFor(callback: (() => boolean), message?: string, interval?: number): void;
declare function runs(callback: (() => void)): void;
