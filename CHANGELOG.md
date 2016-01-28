# 0.29.0
* The *Clean* command now supports the *Output Directory* configuration setting.
  - See [#156](https://github.com/thomasjo/atom-latex/pull/156) for more details.
* Adds support for specifying output format (PDF, PS, DVI). Note that this currently only works when using the latexmk builder.
  - See [#143](https://github.com/thomasjo/atom-latex/pull/143) for more details.
* Fixes problems with the SumatraPDF opener on Windows.
  - See [#140](https://github.com/thomasjo/atom-latex/pull/140) and [#141](https://github.com/thomasjo/atom-latex/pull/141) for more details.
* The default keybinds now only trigger on LaTeX documents (technically this means that the grammar scope must contain the substring `latex`). Hence the [language-latex](https://atom.io/packages/language-latex) package is now a requirement for the default keybinds to work.
  - See [#148](https://github.com/thomasjo/atom-latex/pull/148) for more details.

# 0.28.0
* Adds "engine magic" support to the texify builder.
  - See [#133](https://github.com/thomasjo/atom-latex/pull/133) for more details.

# 0.27.0
* Adds support for specifying the engine to build a specific file with via
  a "magic comment" at the beginning of the file.
  - See [#131](https://github.com/thomasjo/atom-latex/pull/131) for more details.

# 0.26.0
* Adds more default extensions to the clean extensions.
  - See [#117](https://github.com/thomasjo/atom-latex/pull/117) for more details.
* Adds support for Okular as the default PDF application on Linux.
  - See [#124](https://github.com/thomasjo/atom-latex/pull/124) for more details.

# 0.25.0
* Introduces a new builder for MiKTeX's `texify`.
* Adds support for specifying a customer opener.
* *Clean* command now has default shortcut `ctrl-alt-c`.

# 0.24.0
* Clicking the error indicator in the status bar now opens the associated log
  file instead of opening the developer console, and in addition attempts to
  scroll to the first error.

## 0.23.0
* Migrate from CoffeeScript to Babel.

Ideally this should have been a major release since we're migrating away
from CoffeeScript to ES6/ES7 via the Babel transpiler (built into Atom). But
since we're not yet ready for v1.0.0, this major release is tagged as a
minor release.

## 0.22.0
* `Composer:getEditorDetails` now always returns an object.
  Fixes [\#74](https://github.com/thomasjo/atom-latex/issues/74).
* ... and enough, various, mostly internal changes to warrant a minor release instead of just a patch release.

## 0.21.0
* Adds feature flag for the (naive) master file search feature. The feature
  attempts to search for a master file if we determine that the current file
  is not a master file. And this is determined naively by presence, or lack
  thereof, a `\documentclass` declaration. This does not work well in all
  scenarios, so for the time being the feature can be disabled via the new
  feature flag *Use Master File Search* (`atom.useMasterFileSearch`).
  NOTE: This does not affect the *Magic Comments* feature.

## 0.20.0
* Improved TeX path resolution by changing the old behavior of only using the
  `PATH` environment variable in the *Latexmk* child process' `PATH` environment
  variable if the resolved TeX path contains the `$PATH` substitution marker.
  Substitutions are still supported, but the new default is to not use it,
  and when it's not present, the inherited `PATH` environment variable is
  appended to the configured TeX path instead.
* Fixes soft wrap bug caused by incorrect usage of getCursorScreenPosition()
  * See [Pull Request 68](https://github.com/thomasjo/atom-latex/pull/68)
    for more details.
* Changes the default *SumatraPDF* path to
  `C:\Program Files (x86)\SumatraPDF\SumatraPDF.exe`.
* Adds (experimental) out-of-the-box support for MiKTeX 2.9 by adding default
  MiKTeX paths to the default TeX paths on Windows;
  * `C:\Program Files\MiKTeX 2.9\miktex\bin\x64`,
  * `C:\Program Files (x86)\MiKTeX 2.9\miktex\bin`.

## 0.19.0
* Improved the error logging scheme slightly, including
  * Better error message reporting for missing builder executable,
    e.g.`latexmk` caused by incorrect *TeX Path*.
* Extensions used by *Clean* command are now properly configurable.
  * **NOTE:** The command still doesn't work properly together with
    *Output Directory* setting.
* Fixed bugs related to missing files during move, and missing information in
  log file during parsing (e.g. partially failed build).
* Tweaked the config schema descriptions.

## 0.18.0
* Fixed bug triggered by the text "Output written on .." missing from log file,
  while at the same time `latexmk` returned status code 0 (i.e. "success").
  This caused the `outputFilePath` key on the log parsing result to equal 'null'
  and this value thus incorrectly ended up in paths etc. Missing output file
  info is now **always** treated as an error.

## 0.17.0
* Fixed bug caused by incorrect assumption of a log file always being generated
  by a build; moved volatile log parsing result usage to deeper scope.
* Implemented file extension checking prior to invoking a build.
  Right now supported file extensions are `.tex` and `.lhs`. These might be
  configurable in the future unless the entire concept gets re-engineered once
  support for other builders/compilers besides *Latexmk* get implemented.

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
  * Adds engine customization. Default engine is still `pdflatex`, but users can
    now use e.g. `xelatex` instead. This is controlled via configuration.
    See pull request for more [details](https://github.com/thomasjo/atom-latex/commit/42e7c05fd413443d3a2653824d6581bd4601c1b8).
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
* Improved platform detection routines, which ultimately improves support for
  Windows.
* Merged [Pull Request 24]((https://github.com/thomasjo/atom-latex/pull/24).
  * Adds support for opening the resulting PDF after a successful build.
    Behavior is configurable.
* Added a basic Skim.app opener.
  * Used by default if Skim.app exists at the configured path (default path:
    `/Applications/Skim.app`).
* Migrated configuration to the new JSON schema approach supported by Atom for
  an improved user experience.

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
