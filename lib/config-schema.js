"use babel";

import {heredoc} from "./werkzeug";

export default {
  alwaysOpenResultInAtom: {
    type: "boolean",
    default: false,
  },

  builder: {
    description: "Select compiler for LaTeX",
    type: "string",
    enum: ["latexmk", "texify"],
    default: "latexmk",
  },

  cleanExtensions: {
    type: "array",
    items: {type: "string"},
    default: [
      ".aux",
      ".bbl",
      ".blg",
      ".fdb_latexmk",
      ".fls",
      ".log",
      ".out",
      ".pdf",
      ".synctex.gz",
    ],
  },

  customEngine: {
    description: "Enter command for custom LaTeX engine. Overrides Engine.",
    type: "string",
    default: "",
  },

  enableShellEscape: {
    type: "boolean",
    default: false,
  },

  engine: {
    description: "Select standard LaTeX engine",
    type: "string",
    enum: ["pdflatex", "lualatex", "xelatex"],
    default: "pdflatex",
  },

  moveResultToSourceDirectory: {
    title: "Move Result to Source Directory",
    description: heredoc(`Ensures that the output file produced by a successful build
      is stored together with the TeX document that produced it.`),
    type: "boolean",
    default: true,
  },

  openResultAfterBuild: {
    title: "Open Result after Successful Build",
    type: "boolean",
    default: true,
  },

  openResultInBackground: {
    title: "Open Result in Background",
    type: "boolean",
    default: true,
  },

  outputDirectory: {
    description: heredoc(`All files generated during a build will be redirected here.
      Leave blank if you want the build output to be stored in the same
      directory as the TeX document.`),
    type: "string",
    default: "",
  },

  skimPath: {
    description: "Full application path to Skim (OS X).",
    type: "string",
    default: "/Applications/Skim.app",
  },

  sumatraPath: {
    title: "SumatraPDF Path",
    description: "Full application path to SumatraPDF (Windows).",
    type: "string",
    default: "C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe",
  },

  viewerPath: {
    title: "Custom PDF viewer Path",
    description: heredoc(`Full application path to your PDF viewer. Overrides Skim and SumatraPDF options.`),
    type: "string",
    default: "",
  },

  texPath: {
    title: "TeX Path",
    description: heredoc(`The full path to your TeX distribution's bin directory.
      Supports $PATH substitution.`),
    type: "string",
    default: "",
  },

  useMasterFileSearch: {
    description: heredoc(`Enables naive search for master/root file when building distributed documents.
      Does not affect "Magic Comments" functionality.`),
    type: "boolean",
    default: true,
  },
};
