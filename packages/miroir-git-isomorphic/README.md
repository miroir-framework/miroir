# @miroir-framework/git-isomorphic

The Git implementation of Miroir (#679), on [isomorphic-git](https://isomorphic-git.org): Git operations on the repository that holds a filesystem deployment, with no Git binary installed.

It implements `GitRepositoryFactory` from `@miroir-framework/core`. A host (server, Electron main, test setup) registers it only when `features.git` is on, through a dynamic import, so that nothing of it loads before the first Git action:

```ts
ConfigurationService.configurationService.registerGitRepositoryFactory(() =>
  import("@miroir-framework/git-isomorphic").then((m) => m.createGitRepositoryFactory()),
);
```

Never import this package statically from a host: the static import loads `isomorphic-git` at startup.
