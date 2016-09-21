# LaTeX package
[![Build Status](https://travis-ci.org/thomasjo/atom-latex.svg?branch=master)](https://travis-ci.org/thomasjo/atom-latex)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/oc2v06stfwgd3bkn/branch/master?svg=true)](https://ci.appveyor.com/project/thomasjo/atom-latex/branch/master)
[![Dependency Status](https://david-dm.org/thomasjo/atom-latex.svg)](https://david-dm.org/thomasjo/atom-latex)
[![devDependency Status](https://david-dm.org/thomasjo/atom-latex/dev-status.svg)](https://david-dm.org/thomasjo/atom-latex?type=dev)

Compile LaTeX documents from within Atom.

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
please read the instructions on how to [use `latexmk` with MiKTeX](https://github.com/thomasjo/atom-latex/wiki/Using-latexmk-with-MiKTeX)

## Usage
Invoke the `build` command by pressing the default keybind `ctrl-alt-b` while in
a `.tex` file.

### Magic comments
The package has support for the following "magic" TeX comments
- `% !TEX root = ../file.tex` Specify the root file that should be built.
- `% !TEX program = pdflatex` Override the LaTeX engine (pdflatex, lualatex,
  xelatex) to use for build.
- `% !TEX jobnames = foo bar` Control the number and names of build jobs.
- `% !TEX builder = latexmk` Override the LaTeX builder (latexmk, texify).

## Development status
Please note that this package is in a **beta** state. It is stable, but lacks
some important features. As an example, there's no proper error and warning
handling.

Any and all help is greatly appreciated!
