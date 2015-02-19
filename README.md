# LaTeX package
A simple package for Atom that compiles LaTeX files by invoking latexmk.

## Build status
[![Build Status](https://travis-ci.org/thomasjo/atom-latex.svg?branch=master)](https://travis-ci.org/thomasjo/atom-latex)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/p1gi7m58320t5frj/branch/master?svg=true)](https://ci.appveyor.com/project/thomasjo/atom-latex/branch/master)

---

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Usage
Invoke the `build` command by pressing the default keybind `ctrl-alt-b` while in
a .tex file.

## Status
Please note that this package is in a **beta** state. Right now everything is
very naïve. As an example, there's no real error handling; the package merely
prints an error message to the console indicating that an error occurred during
the build, and to check the log file manually...

## TODO
Current wish list, in a semi-prioritized order.

- [x] Progress indicator.
- [ ] Build output.
 - [ ] Error handling.
 - [ ] Warnings, and other non-critical messages.
- [ ] BibTeX autocompletion support.
- [x] Open PDF automatically.
 - [x] Configurable.
 - [x] Support for other distributions, besides OS X.
- [ ] Support for compilers other than latexmk.
 - [ ] Add support for non-PDF typesetting (e.g. dvi).
- [ ] Project management.
 - [ ] Setting to override the output directory.
 - [ ] Setting to override the builder.

If you see something that's missing, or disagree with the prioritization,
consider submitting a [feature request](https://github.com/thomasjo/atom-latex/issues?labels=feature&state=open),
and if you're feeling super helpful, submit a pull request with an updated
TODO list :sparkling_heart:
