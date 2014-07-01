## 0.7.0
* Enables generation of SyncTeX file, although it doesn't do anything yet.
* Switch error log style to `file:line`.
* Overall improvement of code quality, and simplicity.

## 0.6.0
* The child process that executes `latexmk` gets its `PATH` environment
  variable set according to the configured `latex.texPath` value.

## 0.5.0
* Adds support for `-shell-escape`.

## 0.4.0
* Merged [Pull Request #1](https://github.com/thomasjo/atom-latex/pull/1).
  * Run `latexmk` asynchronously.

## 0.3.0
* Introduced menu item _Packages &rarr; Latex &rarr; Build_.
* Fix bug related to `editor` being undefined/null.

## 0.2.0
* Added package configuration.
* Delayed package activation.
* Changed keymap selector from `.workspace` to `.editor`.

## 0.1.0
* First release.
