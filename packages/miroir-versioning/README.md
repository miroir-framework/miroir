# @miroir-framework/versioning

Application versioning for Miroir (#696): the freeze of an application version (`freezeApplicationVersion` of ModelEndpoint) and its planning, snapshots and diff. Core keeps the interfaces: the action type, its payload, the version Entity uuids, the versioning modes and the section routing.

A process loads this package on the first versioning action, and only when its `versioning` capability is on (`features.versioning`, on unless false, off in the sandbox). Hosts that hold the stores (the server, Electron's main process, the CLI, an emulated server, test setups) register it through core, with a dynamic import:

```ts
registerLazyActionImplementations({
  capability: "versioning",
  packageName: VERSIONING_PACKAGE_NAME,
  implementationNames: VERSIONING_ACTION_IMPLEMENTATION_NAMES,
  load: () => import("@miroir-framework/versioning"),
});
```

Never import this package statically from a host or a page: the bundle policies list it as `lazy` and `forbiddenEager`. A browser that talks to a server forwards versioning actions to it and never fetches the package.

```bash
npm run build -w @miroir-framework/versioning
npm run test -w @miroir-framework/versioning
```
