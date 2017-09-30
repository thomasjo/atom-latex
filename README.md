# LaTeX package
[![Build Status][travis svg]][travis]
[![Windows Build Status][appveyor svg]][appveyor]
[![Dependency Status][dependency svg]][dependency]
[![devDependency Status][devDependency svg]][devDependency]

Compile LaTeX, [knitr][], [literate Agda][], [literate Haskell][], or [Pweave][]
documents from within Atom.

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Prerequisites
### TeX distribution
A reasonably up-to-date and working TeX distribution is required. The only
officially supported distributions are [TeX Live][], and [MiKTeX][]. Although,
the latter is not as well tested and supported as TeX Live, hence using TeX Live
is highly recommended.

You need to ensure that the package can find your TeX distribution's binaries;
by default the package uses your `PATH` environment variable, as well as the
following search paths on Linux and macOS

1. `/usr/texbin`
2. `/Library/TeX/texbin`

and on Windows it uses

1. `%SystemDrive%\texlive\2017\bin\win32`
2. `%SystemDrive%\texlive\2016\bin\win32`
3. `%SystemDrive%\texlive\2015\bin\win32`
4. `%ProgramFiles%\MiKTeX 2.9\miktex\bin\x64`
5. `%ProgramFiles(x86)%\MiKTeX 2.9\miktex\bin`

If your TeX distribution's binaries are not installed in one of those locations
or discoverable via the `PATH` environment variable, you will need to help the
package find the binaries. This can be done by setting the *TeX Path*
configuration option to point to the folder containing the binaries, either in
the settings view, or directly in your `config.cson` file. See [Configuration][]
for further details regarding the settings of this package.

### Syntax Highlighting
In order for this package to behave as expected, your Atom environment must
contain a package that provides a LaTeX grammar. We suggest [language-latex][],
but other valid options might exist. Additional syntax packages may be required
to build document types other than LaTeX. For more details see
[Builder Capabilities](#builder-capabilities) below.

### Builder Selection
The `latex` package provides access to two automatic builders for LaTeX and
knitr documents. By default the package will use `latexmk` for LaTeX documents
and an included builder to prepare knitr documents for `latexmk`. In this case
an up to date installation of `latexmk` is required. If you're using TeX Live
then you need only insure that `latexmk` is installed and up to date using the
appropriate package manager.  If you're using MikTeX then see how to [use
`latexmk` with MiKTeX][latexmk with MiKTeX].

The JavaScript based [DiCy][] builder may also be used for all documents by
selecting the `Use DiCy` option in the settings page. [DiCy][] will be installed
automatically and so no further action is required for either TeX Live or
MiKTeX.

### Builder Capabilities

Document types other than LaTeX documents may be processed by this package. The
availability and behavior of this feature depends upon the specific builder
selected. The following table details the different types of documents that may
be processed by each builder and any additional syntax package requirements.

| Document Type    | latexmk based Builder | DiCy Builder | Required Language Packages            |
|------------------|-----------------------|--------------|---------------------------------------|
| LaTeX            | Yes                   | Yes          | [language-latex][]                    |
| knitr            | Yes                   | Yes          | [language-r][] and [language-knitr][] |
| literate Agda    | No preprocessing      | Yes          | [language-agda][]                     |
| literate Haskell | No preprocessing      | Yes          | [language-haskell][]                  |
| Pweave           | No                    | Yes          | [language-weave][]                    |

## Usage
The `latex:build` command can be invoked from the LaTex menu or by pressing the
default keybind <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>b</kbd> while in a LaTex or
knitr file. Log messages and any other messages from the build may be seen in
the LaTeX log panel accessible from the status bar.

The `latex` package supports other commands as detailed in the table below.

| Command               | Keybinding                                  | Use                                                                      |
|:----------------------|:-------------------------------------------:|:-------------------------------------------------------------------------|
| `latex:build`         | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>b</kbd> | Build LaTeX/knitr file and open result.                                  |
| `latex:rebuild`       | None                                        | Force a rebuild of LaTeX/knitr file.                                     |
| `latex:clean`         | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>c</kbd> | Cleanup files after a build.                                             |
| `latex:kill`          | None                                        | Terminate currently running build. Also available from status indicator. |
| `latex:sync`          | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>s</kbd> | Use SyncTeX forward if possible from the current cursor position.        |
| `latex:sync-log`      | None                                        | Display and highlight log messages from the current cursor position.     |
| `latex:check-runtime` | None                                        | Check for the existence of `latexmk`, `Rscript` and PDF/PS/DVI viewers.  |

### Overriding Build Settings
Many of the build settings in the settings page of the `latex` package can be
overridden on a per file basis. One way to override specific build settings is
to use "magic" TeX comments in the form of `% !TEX <name> = <value>`. Another
way is to use a [YAML][] formatted file with the same name as your root LaTeX
file, but with an extension of `.yaml`. The settings and values that can
overridden via either method are listed in the table below. If multiple setting
names are listed then the first is preferred and following names are available
for compatibility. More details can found at [Overridding Build Settings][].

| Name                                    | Value                                          | Use                                                                                       |
|:----------------------------------------|:-----------------------------------------------|:------------------------------------------------------------------------------------------|
| `cleanPatterns`                         | comma separated patterns, e.g. `**/*.blg, foo` | Specify patterns to use for `latex:clean`                                                 |
| `enableSynctex`                         | `yes`, `no`, `true` or `false`                 | Override SyncTeX setting                                                                  |
| `enableExtendedBuildMode`               | `yes`, `no`, `true` or `false`                 | Override extended build mode setting                                                      |
| `enableShellEscape`                     | `yes`, `no`, `true` or `false`                 | Override shell escape setting                                                             |
| `engine` or `program`                   | `pdflatex`, `lualatex`, etc.                   | Override the LaTeX engine to use for build.                                               |
| `moveResultToSourceDirectory`           | `yes`, `no`, `true` or `false`                 | Override move result to source directory setting                                          |
| `outputFormat` or `format`              | `dvi`, `ps` or `pdf`                           | Override the output format                                                                |
| `jobNames`, `jobnames` or `jobname`     | comma separated names, e.g. `foo, bar`         | Control the number and names of build jobs. Only a single name can be used for `jobname`. |
| `outputDirectory` or `output_directory` | directory path, e.g. `build`                   | Specify the output directory that should be used.                                         |
| `producer`                              | `dvipdf`, `dvipdfmx`, `xdvipdfmx` or `ps2pdf`  | Override the PDF producer                                                                 |
| `root`                                  | file path, e.g. `../file.tex`                  | Specify the root file that should be built. Only available via "magic" TeX comments.      |

There are additional settings that may be configured for the DiCy builder that
may not be accessible from this package's setting page, but can be set via a
YAML options file or TeX magic comments. For more details please see
[Options][DiCy Options] and [Configuration][DiCy Configuration] in the DiCy
documentation.

### PDF/DVI/PS Viewers
The `latex` package currently supports [Atril][], [Evince][], [Okular][],
[pdf-view][], [Preview][], [Skim][], [Sumatra PDF][], Windows shell open,
[xdg-open][], [Xreader][] and [Zathura][] as PDF/DVI/PS viewers. This includes
support for cursor synchronization via SyncTeX if possible. Specific features of
each of the viewers is detailed at [Supported Viewers][].

## Development status
Please note that this package is in a **beta** state. It is stable, but lacks
some important features.

Any and all help is greatly appreciated!

<!--refs-->
[appveyor svg]: https://ci.appveyor.com/api/projects/status/oc2v06stfwgd3bkn/branch/master?svg=true
[appveyor]: https://ci.appveyor.com/project/thomasjo/atom-latex/branch/master
[Atril]: http://mate-desktop.com/#atril
[Configuration]: https://github.com/thomasjo/atom-latex/wiki/Configuration
[DiCy]: https://yitzchak.github.io/dicy/
[DiCy Options]: https://yitzchak.github.io/dicy/options
[DiCy Configuration]: https://yitzchak.github.io/dicy/configuration
[dependency svg]: https://david-dm.org/thomasjo/atom-latex.svg
[dependency]: https://david-dm.org/thomasjo/atom-latex
[devDependency svg]: https://david-dm.org/thomasjo/atom-latex/dev-status.svg
[devDependency]: https://david-dm.org/thomasjo/atom-latex?type=dev
[Evince]: https://wiki.gnome.org/Apps/Evince
[knitr]: http://yihui.name/knitr/
[language-agda]: https://atom.io/packages/language-agda
[language-haskell]: https://atom.io/packages/language-haskell
[language-knitr]: https://atom.io/packages/language-knitr
[language-latex]: https://atom.io/packages/language-latex
[language-r]: https://atom.io/packages/language-r
[language-weave]: https://atom.io/packages/language-weave
[latexmk with MiKTeX]: https://github.com/thomasjo/atom-latex/wiki/Using-latexmk-with-MiKTeX
[literate Agda]: http://wiki.portal.chalmers.se/agda/pmwiki.php?n=Main.LiterateAgda
[literate Haskell]: https://wiki.haskell.org/Literate_programming
[MiKTeX]: http://miktex.org/
[Okular]: https://okular.kde.org/
[Overridding Build Settings]: https://github.com/thomasjo/atom-latex/wiki/Overridding-Build-Settings
[pdf-view]: https://atom.io/packages/pdf-view
[Preview]: https://support.apple.com/en-us/HT201740
[pweave]: https://github.com/mpastell/Pweave
[Skim]: http://skim-app.sourceforge.net/
[Sumatra PDF]: http://www.sumatrapdfreader.org/free-pdf-reader.html
[Supported Viewers]: https://github.com/thomasjo/atom-latex/wiki/Supported-Viewers
[TeX Live]: https://www.tug.org/texlive/
[travis svg]: https://travis-ci.org/thomasjo/atom-latex.svg?branch=master
[travis]: https://travis-ci.org/thomasjo/atom-latex
[xdg-open]: https://linux.die.net/man/1/xdg-open
[Xreader]: https://github.com/linuxmint/xreader
[YAML]: http://yaml.org/
[Zathura]: https://github.com/pwmt/zathura
