# miroir-core

The core of Miroir: the meta-model and its generated types, queries, transformers, actions, the domain controller, the configuration service on which stores register, logging and the activity tracker. Every other Miroir package builds on it.

The package will be published as `@miroir-framework/core` (epic #621).

## API stability

`miroir-core` is in 0.x: no export is stable, and any of them may change in any release.

The exports an application is meant to use carry the `@public` TSDoc tag, which your editor shows on hover. They are listed in [docs/reference/core-public-api.md](https://github.com/miroir-framework/miroir/blob/main/docs/reference/core-public-api.md). They are what the application template imports, plus the core types named by the startup calls (`startMiroirNode`, `startMiroirClient`, `createMiroirServerApp`).

Everything else `miroir-core` exports serves the other Miroir packages, which are released with it in lockstep. A type reached through a public name (the type of one of its properties or parameters) can be used as part of that name, without a promise of its own. The subpath entries `miroir-core/model-validation-fs` and `miroir-core/ml-to-ts` are tooling, without `@public` marks.

## License

MIT, see [LICENSE.md](./LICENSE.md).
