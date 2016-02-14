# Changelog
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## v0.29.0 (2015-01-28)
### Added
- Adds support for specifying output format (PDF, PS, DVI). Note that this currently only works when using the latexmk builder.
  - See [#143](https://github.com/thomasjo/atom-latex/pull/143) for more details.

### Changed
- The *Clean* command now supports the *Output Directory* configuration setting.
  - See [#156](https://github.com/thomasjo/atom-latex/pull/156) for more details.
- The default keybinds now only trigger on LaTeX documents (technically this means that the grammar scope must contain the substring `latex`). Hence the [language-latex](https://atom.io/packages/language-latex) package is now a requirement for the default keybinds to work.
  - See [#148](https://github.com/thomasjo/atom-latex/pull/148) for more details.

### Fixed
- Problems with the SumatraPDF opener on Windows.
  - See [#140](https://github.com/thomasjo/atom-latex/pull/140) and [#141](https://github.com/thomasjo/atom-latex/pull/141) for more details.

## v0.28.0 (2015-10-26)
### Added
- "engine magic" support to the texify builder.
  - See [#133](https://github.com/thomasjo/atom-latex/pull/133) for more details.

## v0.27.0 (2015-10-21)
### Added
- Support for specifying the engine to build a specific file with via a "magic
  comment" at the beginning of the file.
  - See [#131](https://github.com/thomasjo/atom-latex/pull/131) for more details.

## v0.26.0 (2015-10-04)
### Added
- More default extensions to the clean extensions.
  - See [#117](https://github.com/thomasjo/atom-latex/pull/117) for more details.
- Support for Okular as the default PDF application on Linux.
  - See [#124](https://github.com/thomasjo/atom-latex/pull/124) for more details.

## v0.25.0 (2015-07-05)
### Added
- Introduces a new builder for MiKTeX's `texify`.
- Support for specifying a customer opener.

### Changed
- *Clean* command now has default shortcut `ctrl-alt-c`.

## v0.24.0 (2015-05-23)
### Changed
- Clicking the error indicator in the status bar now opens the associated log
  file instead of opening the developer console, and in addition attempts to
  scroll to the first error.

## v0.23.0 (2015-05-07)
Migration from CoffeeScript to Babel.

Ideally this should have been a major release since we're migrating away
from CoffeeScript to ES6/ES7 via the Babel transpiler (built into Atom). But
since we're not yet ready for v1.0.0, this major release is tagged as a
minor release.

## v0.22.0 (2015-04-21)
### Fixed
- `Composer:getEditorDetails` now always returns an object.
  Fixes [#74](https://github.com/thomasjo/atom-latex/issues/74).

## v0.21.0 (2015-04-06)
### Added
- Feature flag for the (naive) master file search feature. The feature
  attempts to search for a master file if we determine that the current file
  is not a master file. And this is determined naively by presence, or lack
  thereof, a `\documentclass` declaration. This does not work well in all
  scenarios, so for the time being the feature can be disabled via the new
  feature flag *Use Master File Search* (`atom.useMasterFileSearch`).
  NOTE: This does not affect the *Magic Comments* feature.

## v0.20.0 (2015-03-17)
### Added
- Experimental, out-of-the-box support for MiKTeX 2.9 by adding default
  MiKTeX paths to the default TeX paths on Windows;
  - `C:\Program Files\MiKTeX 2.9\miktex\bin\x64`,
  - `C:\Program Files (x86)\MiKTeX 2.9\miktex\bin`.

### Changed
- Improved TeX path resolution by changing the old behavior of only using the
  `PATH` environment variable in the *Latexmk* child process' `PATH` environment
  variable if the resolved TeX path contains the `$PATH` substitution marker.
  Substitutions are still supported, but the new default is to not use it,
  and when it's not present, the inherited `PATH` environment variable is
  appended to the configured TeX path instead.
- Default *SumatraPDF* path changed to  
  `C:\Program Files (x86)\SumatraPDF\SumatraPDF.exe`.

### Fixed
- Soft wrap bug caused by incorrect usage of getCursorScreenPosition()
  - See [Pull Request 68](https://github.com/thomasjo/atom-latex/pull/68) for
    more details.

## v0.19.0 (2015-03-02)
### Changed
- Improved the error logging scheme slightly, including better error messages
  for missing builder executables, e.g.`latexmk` caused by an incorrectly
  configured *TeX Path*.
- Extensions used by the *Clean* command are now properly configurable.
  **NOTE:** The command doesn't yet work properly together with *Output
  Directory* setting.
- Tweaked the config schema descriptions.

### Fixed
- Bugs related to missing files during move, and missing information in log
  file during parsing (e.g. partially failed build).

## v0.18.0 (2015-02-06)
### Fixed
- Bug triggered by the text "Output written on .." missing from log file, while at the same time `latexmk` returned status code 0 (i.e. "success"). This
  caused the `outputFilePath` key on the log parsing result to equal 'null' and
  this value thus incorrectly ended up in paths etc. Missing output file info
  is now **always** treated as an error.

## v0.17.0 (2015-02-05)
### Changed
- Implemented file extension checking prior to invoking a build.
  Right now supported file extensions are `.tex` and `.lhs`. These might be
  configurable in the future unless the entire concept gets re-engineered once
  support for other builders/compilers besides *Latexmk* get implemented.

### Fixed
- Bug caused by incorrect assumption of a log file always being generated by a
  build; moved volatile log parsing result usage to deeper scope.

## v0.16.0 (2015-01-28)
### Added
- Support for cross-platform and Windows PDF viewers.
  - Merged [Pull Request 48](https://github.com/thomasjo/atom-latex/pull/48).
- *Clean* feature that deletes temporary files generated during build.
  - Merged [Pull Request 47](https://github.com/thomasjo/atom-latex/pull/47).

### Fixed
- Issue with config schema loading being deferred due to package only being
  activated on triggering *Build* (or *Clean*). The workaround was to disable
  delayed package activation, so this will likely need to be revisited in the
  future.
- Deprecation warning in `keymaps/latex.cson`.
  - Merged [Pull Request 44](https://github.com/thomasjo/atom-latex/pull/44).

## v0.15.0 (2015-01-19)
### Added
- Engine customization. Default engine is still `pdflatex`, but users can now
  use e.g. `xelatex` instead. This is controlled via configuration.
  - Merged [Pull Request 39](https://github.com/thomasjo/atom-latex/pull/39).
- Support for *Literal Haskell* filetypes.
  - Merged [Pull Request 40](https://github.com/thomasjo/atom-latex/pull/40).

## v0.14.0 (2014-11-02)
### Added
- Forward-sync support for Skim. Also lays the groundwork for other openers with
  sync support. Default keybind is `ctrl-alt-s`.
  - Merged [Pull Request 31](https://github.com/thomasjo/atom-latex/pull/31).

## v0.13.0 (2014-10-22)
### Added
- Basic error log parsing routines. Only handles the simplest of scenarios, and
  needs to be expanded.

### Changed
- By default we now move the output file after a successful build, including
  the SyncTeX file if it exists. The files are moved to the source directory,
  i.e. the directory containing the processed root TeX file.
  - The behavior is configurable via `latex.moveResultToSourceDirectory`.
- Improved configuration descriptions.

## v0.12.0 (2014-10-06)
### Added
- Error status indicator to the status bar.
  - Merged [Pull Request 12]((https://github.com/thomasjo/atom-latex/pull/12).
- Basic support for parsing magic comments.
- Master/root TeX file feature which supports both magic comments and a
  heuristic search algorithm. If building a descendant TeX file, this feature
  ensures the root file is built instead.
  - Merged [Pull Request 13]((https://github.com/thomasjo/atom-latex/pull/13).
- Support for opening the resulting PDF after a successful build. Behavior is
  configurable.
  - Merged [Pull Request 24]((https://github.com/thomasjo/atom-latex/pull/24).
- Added a basic Skim.app opener.  
  Used by default if Skim.app exists at the configured path which defaults to
  `/Applications/Skim.app`.

### Changed
- Improved platform detection routines, which ultimately improves support for
  Windows.
- Migrated configuration to the new JSON schema approach supported by Atom for
  an improved user experience.

## v0.11.0 (2014-07-01)
### Changed
- Improved the error messages to help users debug e.g. bad `PATH`.
  [#10](https://github.com/thomasjo/atom-latex/pull/10)

## v0.10.0 (2014-06-25)
### Changed
- Refactored code to minimize direct dependence on `latexmk` in an attempt
  to prepare for future support of other TeX builders.
- Lots of improvements to overall code quality, and test coverage.

## v0.9.0 (2014-05-11)
### Added
- Simple progress indicator.

## v0.8.0 (2014-05-09)
### Fixed
- Issues due to filenames containing spaces.  
  For reference see
    [#5](https://github.com/thomasjo/atom-latex/issues/5) and
    [#7](https://github.com/thomasjo/atom-latex/issues/7).

## v0.7.0 (2014-05-04)
### Added
- Enables generation of SyncTeX file, although it doesn't do anything yet.

### Changed
- Switch error log style to `file:line`.
- Only set `PATH` environment variable on the actual child process that
  executes `latexmk`, instead of setting it for the entire Atom process.
- Overall improvement of code quality, and simplicity.

## v0.6.0 (2014-04-23)
### Changed
- When the package is activated, sets `process.env.PATH` equal to the
  configured `latex.texPath` value.

## v0.5.0 (2014-04-06)
### Added
- Support for `-shell-escape`.

## v0.4.0 (2014-03-17)
### Changed
- The `latexmk` executable is now run asynchronously.
  [#1](https://github.com/thomasjo/atom-latex/pull/1)

## v0.3.0 (2014-03-14)
### Added
- Introduced *Build* menu item.

### Fixed
- Not properly handling `editor` being undefined/null.

## v0.2.0 (2014-03-13)
### Added
- Package configuration.

### Changed
- Delayed package activation.
- Changed keymap selector from `.workspace` to `.editor`.

## v0.1.0 (2014-03-06)
- First release.

[Unreleased]: https://github.com/thomasjo/atom-latex/compare/v0.29.0...HEAD
[0.29.0]: https://github.com/thomasjo/atom-latex/compare/v0.28.2...v0.29.0
[0.28.2]: https://github.com/thomasjo/atom-latex/compare/v0.28.1...v0.28.2
[0.28.1]: https://github.com/thomasjo/atom-latex/compare/v0.28.0...v0.28.1
[0.28.0]: https://github.com/thomasjo/atom-latex/compare/v0.27.1...v0.28.0
[0.27.1]: https://github.com/thomasjo/atom-latex/compare/v0.27.0...v0.27.1
[0.27.0]: https://github.com/thomasjo/atom-latex/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/thomasjo/atom-latex/compare/v0.25.1...v0.26.0
[0.25.1]: https://github.com/thomasjo/atom-latex/compare/v0.25.0...v0.25.1
[0.25.0]: https://github.com/thomasjo/atom-latex/compare/v0.24.2...v0.25.0
[0.24.2]: https://github.com/thomasjo/atom-latex/compare/v0.24.1...v0.24.2
[0.24.1]: https://github.com/thomasjo/atom-latex/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/thomasjo/atom-latex/compare/v0.23.4...v0.24.0
[0.23.4]: https://github.com/thomasjo/atom-latex/compare/v0.23.3...v0.23.4
[0.23.3]: https://github.com/thomasjo/atom-latex/compare/v0.23.2...v0.23.3
[0.23.2]: https://github.com/thomasjo/atom-latex/compare/v0.23.1...v0.23.2
[0.23.1]: https://github.com/thomasjo/atom-latex/compare/v0.23.0...v0.23.1
[0.23.0]: https://github.com/thomasjo/atom-latex/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/thomasjo/atom-latex/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/thomasjo/atom-latex/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/thomasjo/atom-latex/compare/v0.19.1...v0.20.0
[0.19.1]: https://github.com/thomasjo/atom-latex/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/thomasjo/atom-latex/compare/v0.18.1...v0.19.0
[0.18.1]: https://github.com/thomasjo/atom-latex/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/thomasjo/atom-latex/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/thomasjo/atom-latex/compare/v0.16.1...v0.17.0
[0.16.1]: https://github.com/thomasjo/atom-latex/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/thomasjo/atom-latex/compare/v0.15.2...v0.16.0
[0.15.2]: https://github.com/thomasjo/atom-latex/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/thomasjo/atom-latex/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/thomasjo/atom-latex/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/thomasjo/atom-latex/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/thomasjo/atom-latex/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/thomasjo/atom-latex/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/thomasjo/atom-latex/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/thomasjo/atom-latex/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/thomasjo/atom-latex/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/thomasjo/atom-latex/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/thomasjo/atom-latex/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/thomasjo/atom-latex/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/thomasjo/atom-latex/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/thomasjo/atom-latex/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/thomasjo/atom-latex/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/thomasjo/atom-latex/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/thomasjo/atom-latex/commit/5272032
