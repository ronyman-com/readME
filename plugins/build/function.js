export default {
  preBuild: () => { /* called before build starts */ },
  postBuild: () => { /* called after successful build */ },
  buildFailed: (error) => { /* called when build fails */ },
  buildProcess: (process) => { /* access to build process */ }
}