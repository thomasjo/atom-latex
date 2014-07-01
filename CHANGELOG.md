## 0.11.0
* Merged [Pull Request 10](https://github.com/thomasjo/atom-latex/pull/10).
  * Improves the error messages to help users debug e.g. bad `PATH`.

## 0.10.0
* Refactor code to minimize direct dependence on `latexmk` in an attempt
  to prepare for future support of other TeX builders.
* Lots of improvements to overall code quality, and test coverage.

## 0.9.0
* Introduces a simple progress indicator.

## 0.8.0
* Bugfix related to filenames containing spaces.
  This resolved [#5](https://github.com/thomasjo/atom-latex/issues/5)
  and [#7](https://github.com/thomasjo/atom-latex/issues/7).

## 0.7.0
* Enables generation of SyncTeX file, although it doesn't do anything yet.
* Switch error log style to `file:line`.
* Only set `PATH` environment variable on the actual child process that
  executes `latexmk`, instead of setting it for the entire Atom process.
* Overall improvement of code quality, and simplicity.

## 0.6.0
* When the package is activated, sets `process.env.PATH` equal to the
  configured `latex.texPath` value.

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
