# miroir-app-meta

The Meta application holds data about the development process of the Miroir platform, as Miroir Entities. Its model and data are tracked in git under `assets/meta_model/` and `assets/meta_data/`.

It is installed by the `dev` environment (live: what the app writes lands in the tracked files) and by `test-filesystem` (a copy). The other environments do not install it.

## Bundle size history (#473)

`BundleSizeMeasurement` has one instance per recorded bundle size of `miroir-standalone-app` (the web page) and `miroir-standalone-app-electron` (the Electron main process). The `BundleSizeHistory` Report, the app's home page, shows a line graph and a list per application.

```bash
# record a build as the new baseline of the bundle guard (writes the policy and an instance)
npm run bundle-size:record -w miroir-app-meta -- packages/miroir-standalone-app/dist/.vite/bundle-report.json --reason "why"
# rebuild the records from the git history of the bundle policies (skips the commits already recorded)
npm run bundle-size:backfill -w miroir-app-meta -- --dry-run
```

`bundle-size:record` options: `--baseline N`, `--reason TEXT`, `--init` (also rewrite the package lists), `--policy FILE`, `--data-dir DIR`, `--no-policy`. The guard (`scripts/check_bundle_policy.py`) fails when a policy's baseline is not the newest recorded one. Details: `docs/internals/code-splitting.md`.

Tests: `npm run testByFile -w miroir-app-meta -- <file>` (model validation, record and backfill scripts); the report MiroirTest `report.bundleSizeHistory` runs from miroir-standalone-app on fixed measurements (`testConfiguration_metaBundleSizeSeed`).
