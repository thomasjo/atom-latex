module.exports =
  enableShellEscape:
    type: 'boolean'
    default: false
  moveResultToSourceDirectory:
    description: 'Ensures that the output file produced by a successful build
      is stored together with the TeX document that produced it.'
    type: 'boolean'
    default: true
  openResultAfterBuild:
    type: 'boolean'
    default: true
  openResultInBackground:
    type: 'boolean'
    default: true
  outputDirectory:
    description: 'All files generated during a build will be redirected here.
      Leave blank if you want the build output to be stored in the same
      directory as the TeX document.'
    type: 'string'
    default: ''
  skimPath:
    type: 'string'
    default: '/Applications/Skim.app'
  texPath:
    title: 'TeX Path'
    description: "The full path to your TeX distribution's bin directory."
    type: 'string'
    default: ''
