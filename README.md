# LaTeX package
[![Build Status][travis svg]][travis]
[![Windows Build Status][appveyor svg]][appveyor]
[![Dependency Status][dependency svg]][dependency]
[![devDependency Status][devDependency svg]][devDependency]

Compile LaTeX or [knitr] documents from within Atom.

## Installing
Use the Atom package manager and search for "latex", or run `apm install latex`
from the command line.

## Prerequisites
### TeX distribution
Since this package relies upon `latexmk`, a reasonably up-to-date and working
TeX distribution is required. The only officially supported distributions are
[TeX Live], and [MiKTeX]. Although, the latter is not as well tested and
supported as TeX Live, hence using TeX Live is highly recommended.

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
the settings view, or directly in your `config.cson` file. See [Configuration]
for further details regarding the settings of this package.

#### TeX Live
If you're using TeX Live and have installed to the default location then no
further action should be required.

#### MiKTeX
If you're using MikTeX and have not installed the required `latexmk` package,
learn how to [use `latexmk` with MiKTeX][latexmk with MiKTeX].

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

### Overriding Build settings
Many of the build settings in the settings page of the `latex` package can be
overridden on a per file basis. One way to override specific build settings is
to use "magic" TeX comments in the form of `% !TEX <name> = <value>`. Another
way is to use a [YAML] formatted file with the same name as your root LaTeX
file, but with an extension of `.yaml`. The settings and values that can
overridden via either method are listed in the table below. If multiple setting
names are listed then the first is preferred and following names are available
for compatibility. More details can found at [Overridding Build Settings].

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

### PDF/DVI/PS Viewers
The `latex` package currently supports [Atril], [Evince], [Okular], [pdf-view],
[Preview], [Skim], [Sumatra PDF], Windows shell open, [xdg-open], [Xreader] and
[Zathura] as PDF/DVI/PS viewers. This includes support for cursor
synchronization via SyncTeX if possible. Specific features of each of the
viewers is detailed at [Supported Viewers].

## Development status
Please note that this package is in a **beta** state. It is stable, but lacks
some important features.

Any and all help is greatly appreciated!

<!--refs-->
[appveyor svg]: https://ci.appveyor.com/api/projects/status/oc2v06stfwgd3bkn/branch/master?svg=true
[appveyor]: https://ci.appveyor.com/project/thomasjo/atom-latex/branch/master
[Atril]: http://mate-desktop.com/#atril
[Configuration]: https://github.com/thomasjo/atom-latex/wiki/Configuration
[dependency svg]: https://david-dm.org/thomasjo/atom-latex.svg
[dependency]: https://david-dm.org/thomasjo/atom-latex
[devDependency svg]: https://david-dm.org/thomasjo/atom-latex/dev-status.svg
[devDependency]: https://david-dm.org/thomasjo/atom-latex?type=dev
[Evince]: https://wiki.gnome.org/Apps/Evince
[knitr]: http://yihui.name/knitr/
[latexmk with MiKTeX]: https://github.com/thomasjo/atom-latex/wiki/Using-latexmk-with-MiKTeX
[MiKTeX]: http://miktex.org/
[Okular]: https://okular.kde.org/
[Overridding Build Settings]: https://github.com/thomasjo/atom-latex/wiki/Overridding-Build-Settings
[pdf-view]: https://atom.io/packages/pdf-view
[Preview]: https://support.apple.com/en-us/HT201740
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
