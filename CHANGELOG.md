## 0.16.0
* Fixed issue with config schema loading being deferred due to package only
  being activated on triggering *Build* (or *Clean*). The workaround was to
  disabled delayed package activation, so this will likely need to be revisited
  in the future.
* Merged [Pull Request 44](https://github.com/thomasjo/atom-latex/pull/44).
  * Fixes deprecation warning in `keymaps/latex.cson`.
* Merged [Pull Request 48](https://github.com/thomasjo/atom-latex/pull/48).
  * Adds support for cross-platform and Windows PDF viewers.
* Merged [Pull Request 47](https://github.com/thomasjo/atom-latex/pull/47).
  * Adds *Clean* feature that deletes temporary files generated during build.

## 0.15.0
* Merged [Pull Request 39](https://github.com/thomasjo/atom-latex/pull/39).
  * Adds engine customization. Default engine is still `pdflatex`, but users can now use e.g. `xelatex` instead. This is controlled via configuration. See pull request for more [details](https://github.com/thomasjo/atom-latex/commit/42e7c05fd413443d3a2653824d6581bd4601c1b8).
* Merged [Pull Request 40](https://github.com/thomasjo/atom-latex/pull/40).
  * Adds support for *Literal Haskell* filetypes.

## 0.14.0
* Merged [Pull Request 31](https://github.com/thomasjo/atom-latex/pull/31).
  * Introduces forward-sync support for Skim, and lays the groundwork for other
    openers with sync support. Default keybind is `ctrl-alt-s`.

## 0.13.0
* Move output file (including SyncTeX file) to source dir.
  * By default we now move the output file after a successful build, including
  the SyncTeX file if it exists. The files are moved to the source directory,
  i.e. the directory containing the processed root TeX file.
  * The behavior is configurable via `latex.moveResultToSourceDirectory`.
* Added some basic error log parsing routines. Only handles the simplest of
  scenarios, needs to be expanded.
* Improved configuration descriptions.

## 0.12.0
* Merged [Pull Request 12]((https://github.com/thomasjo/atom-latex/pull/12).
  * Adds an error status indicator to the status bar.
* Implemented basic support for parsing magic comments.
* Merged [Pull Request 13]((https://github.com/thomasjo/atom-latex/pull/13).
  * Adds a master/root TeX file feature which supports both magic comments and a
    heuristic search algorithm. If building a descendant TeX file, this feature
    ensures the root file is built instead.
* Improved platform detection routines, which ultimately improves support for Windows.
* Merged [Pull Request 24]((https://github.com/thomasjo/atom-latex/pull/24).
  * Adds support for opening the resulting PDF after a successful build. Behavior is configurable.
* Added a basic Skim.app opener.
  * Used by default if Skim.app exists at the configured path (default path: `/Applications/Skim.app`).
* Migrated configuration to the new JSON schema approach supported by Atom for an improved
  user experience.

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
