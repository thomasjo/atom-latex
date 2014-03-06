# LaTeX package

A simple utility package for Atom that invokes `latexmk`.

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Status
This package is in an extreme alpha state. Right now everything is very naïve,
there's no error handling, progress indicator, etc. The path to `latexmk` is
hardcoded to `/usr/texbin/latexmk`, and forces usage of `pdflatex`.

## Usage
Invoke the build command by pressing the default keybind `ctrl-alt-b` while in
a .tex file.

All output is directed to a directory called `output` within the directory
containing the target file.
