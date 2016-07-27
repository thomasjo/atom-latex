# LaTeX package
[![Build Status](https://travis-ci.org/thomasjo/atom-latex.svg?branch=master)](https://travis-ci.org/thomasjo/atom-latex)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/oc2v06stfwgd3bkn/branch/master?svg=true)](https://ci.appveyor.com/project/thomasjo/atom-latex/branch/master)
[![Dependency Status](https://david-dm.org/thomasjo/atom-latex.svg)](https://david-dm.org/thomasjo/atom-latex)
[![devDependency Status](https://david-dm.org/thomasjo/atom-latex/dev-status.svg)](https://david-dm.org/thomasjo/atom-latex#info=devDependencies)

Compile LaTeX documents from within Atom.

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Prerequisites
### TeX distribution
Since this package relies upon either `latexmk` or `texify`, a reasonably up to
date and working TeX distribution is required. The only current officially
supported distributions are [TeX Live](https://www.tug.org/texlive/), and
[MiKTeX](http://miktex.org/). Although the latter is not as well tested and
supported as TeX Live, hence using TeX Live is highly recommended.

You need to ensure that the package can find your TeX distribution; to help the
package find the distribution's binaries, you need to configure the *TeX Path*
configuration variable to point to the folder containing the binaries. This can
be done either in the settings view, or directly in your `config.cson` file.

#### TeX Live
If you're using TeX Live and have installed to the default location then no
further action should be required.

#### MiKTeX
If you're using MikTeX and have installed to the default location then all you
should need to do is change the *Builder* to `texify`. This can be done either
in the settings view, or directly in your `config.cson` file.

## Usage
Invoke the `build` command by pressing the default keybind `ctrl-alt-b` while in
a `.tex` file.

### Magic comments
The package has support for the following "magic" TeX comments
- `% !TEX root = ../file.tex` Specify the root file that should be built.
- `% !TEX program = pdflatex` Override the LaTeX engine (pdflatex, lualatex,
  xelatex) to use for build.
- `% !TEX jobnames = foo bar` Control the number and names of build jobs.

## Development status
Please note that this package is in a **beta** state. It is stable, but lacks
some important features. As an example, there's no proper error and warning
handling.

Any and all help is greatly appreciated!

### TODO
Current wish list, in a semi-prioritized order.

- [ ] Improved build output parsing;
  - [x] Error handling.
  - [ ] Warnings, and other non-critical messages.
- [ ] Project-specific settings;
  - [ ] Setting to override the output directory.
  - [ ] Setting to override the builder.

If you see something that's missing, or disagree with the prioritization,
consider submitting a [feature request](https://github.com/thomasjo/atom-latex/issues?labels=feature&state=open),
and if you're feeling super helpful, submit a pull request with an updated TODO
list :sparkling_heart:
