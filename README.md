# LaTeX package
[![Build Status](https://travis-ci.org/thomasjo/atom-latex.svg?branch=master)](https://travis-ci.org/thomasjo/atom-latex)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/oc2v06stfwgd3bkn/branch/master?svg=true)](https://ci.appveyor.com/project/thomasjo/atom-latex/branch/master)
[![Dependency Status](https://david-dm.org/thomasjo/atom-latex.svg)](https://david-dm.org/thomasjo/atom-latex)
[![devDependency Status](https://david-dm.org/thomasjo/atom-latex/dev-status.svg)](https://david-dm.org/thomasjo/atom-latex?type=dev)

Compile LaTeX or Knitr documents from within Atom.

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Prerequisites
### TeX distribution
Since this package relies upon `latexmk`, a reasonably up-to-date and working
TeX distribution is required. The only officially supported distributions are
[TeX Live](https://www.tug.org/texlive/), and [MiKTeX](http://miktex.org/).
Although, the latter is not as well tested and supported as TeX Live, hence
using TeX Live is highly recommended.

You need to ensure that the package can find your TeX distribution's binaries;
by default the package uses your `PATH` environment variable, as well as the
following search paths on Linux and macOS

1. `/usr/texbin`
2. `/Library/TeX/texbin`

and on Windows it uses

1. `%SystemDrive%\texlive\2016\bin\win32`
2. `%SystemDrive%\texlive\2015\bin\win32`
3. `%SystemDrive%\texlive\2014\bin\win32`
4. `%ProgramFiles%\MiKTeX 2.9\miktex\bin\x64`
5. `%ProgramFiles(x86)%\MiKTeX 2.9\miktex\bin`

If your TeX distribution's binaries are not installed in one of those locations
or discoverable via the `PATH` environment variable, you will need to help the
package find the binaries. This can be done by setting the *TeX Path*
configuration option to point to the folder containing the binaries, either in
the settings view, or directly in your `config.cson` file.

#### TeX Live
If you're using TeX Live and have installed to the default location then no
further action should be required.

#### MiKTeX
If you're using MikTeX and have not installed the required `latexmk` package,
learn how to [use `latexmk` with MiKTeX](https://github.com/thomasjo/atom-latex/wiki/Using-latexmk-with-MiKTeX).

## Usage
The `latex:build` command can be invoked from the LaTex menu or by pressing the
default keybind <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>b</kbd> while in a LaTex or Knitr file.

The `latex` package supports other commands as detailed in the table below.

| Command         | Keybinding                                  | Use                                                               |
|:----------------|:--------------------------------------------|:------------------------------------------------------------------|
| `latex:build`   | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>b</kbd> | Build LaTeX/Knitr file and open result.                           |
| `latex:rebuild` | None                                        | Force a rebuild of LaTeX/Knitr file.                              |
| `latex:clean`   | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>c</kbd> | Cleanup files after a build.                                      |
| `latex:sync`    | <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>s</kbd> | Use SyncTeX forward if possible from the current cursor position. |

### Magic comments
The package has support for various "magic" TeX comments in the form of
`% !TEX <name> = <value>` as detailed in the table below.

| Name       | Value                                 | Use                                         |
|:-----------|:--------------------------------------|:--------------------------------------------|
| `format`   | `dvi`, `ps`, `pdf`                    | Override the output format                  |
| `jobnames` | space separated names, e.g. `foo bar` | Control the number and names of build jobs. |
| `producer` | `dvipdf`, `dvipdfmx`, `xdvipdfmx`     | Override the PDF producer                   |
| `program`  | `pdflatex`, `lualatex`, etc.          | Override the LaTeX engine to use for build. |
| `root`     | file path, e.g. `../file.tex`         | Specify the root file that should be built. |

### PDF/DVI/PS Viewers
THe `latex` package supports various PDF/DVI/PS viewers, including support for cursor
synchronization via SyncTeX if possible. Specific features of each of the viewers is detailed on the
[Wiki](https://github.com/thomasjo/atom-latex/wiki/Supported-Viewers). The currently supported viewers are:

- [pdf-view](https://atom.io/packages/pdf-view)
- [Evince](https://wiki.gnome.org/Apps/Evince)
- [Okular](https://okular.kde.org/)
- [Preview](https://support.apple.com/en-us/HT201740)
- [Skim](http://skim-app.sourceforge.net/)
- [Sumatra PDF](http://www.sumatrapdfreader.org/free-pdf-reader.html)
- [xdg-open](https://linux.die.net/man/1/xdg-open)

## Development status
Please note that this package is in a **beta** state. It is stable, but lacks
some important features. As an example, there's no proper error and warning
handling.

Any and all help is greatly appreciated!
