# LaTeX package

A simple package for Atom that compiles LaTeX files by invoking latexmk.

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Status
This package is in an **extreme alpha** state. Right now everything is very naïve,
there's no error handling, progress indicator, and so on.

Right now the package is hardcoded to typeset using pdfTeX. This will be
configurable in the near future.

## Usage
Invoke the `build` command by pressing the default keybind `ctrl-alt-b` while in
a .tex file.
