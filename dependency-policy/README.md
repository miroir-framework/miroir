# Dependency policy data

Data read by `scripts/check_dependency_policy.py` and the reasons behind root `package.json` entries that JSON cannot comment. The policy itself: [docs/contributing/development-setup.md](../docs/contributing/development-setup.md), Dependency policy. Design: [#326 analysis](../code-helpers/features/326-BUILD-build-hardening/analysis.md).

## Root `overrides`

An override forces one version of a package everywhere in the tree, whatever its parents ask for. Each one is listed here; remove it once the "remove when" condition holds, and run `python scripts/check_dependency_policy.py` afterwards.

| Package | Version | Why | Added | Remove when |
|---|---|---|---|---|
| `rxjs` | 7.8.2 | One RxJS instance for the app and CopilotKit / AG-UI, which each asked for their own 7.8.1 copy | e3e3c32 ("deduped RxJS"), pinned in #326 | no dependency pins an `rxjs` version other than ours |
| `yaml` | 2.9.1 | One `yaml` 2.x across the tree: `cosmiconfig` 7 (under `babel-plugin-macros`) asks for `^1.10.0`; also overrides the `2.9.0` pin of `nx` 23 (lerna 10) | 190d5ec (#246), pinned in #326 | no dependency asks for `yaml` 1.x |
| `lerna` > `js-yaml` | 4.3.2 | `lerna` 10.0.1 pins `js-yaml` 4.3.0: GHSA-2883-xcg3-v3hh, GHSA-5p4m-2wfm-xmqj (high) | #326 Slice 6 | `lerna` pins `js-yaml` ≥ 4.3.2 |
| `lerna` > `pacote` | 21.5.1 | `lerna` 10.0.1 pins `pacote` 21.0.1: GHSA-w4pp-8pjf-rmxw (high) | #326 Slice 6 | `lerna` pins `pacote` ≥ 21.5.1 |
| `nx` > `smol-toml` | 1.7.1 | `nx` 23.2.1 (under `lerna`) pins `smol-toml` 1.6.1: GHSA-7w5x-hrqm-74c2 (high) | #326 Slice 6 | `nx` pins `smol-toml` ≥ 1.7.1 |
| `@connectrpc/connect-node` > `undici` | 6.28.1 | `@connectrpc/connect-node` 1.7.0 (under `miroir-ai` and `@cursor/sdk`) asks for `undici` `^5.28.4`; 5.x has high advisories fixed only in 6.24 and 6.27 (GHSA-vrm6-8vpv-qv8q, GHSA-v9p9-hfj2-hcw8, GHSA-vxpw-j846-p89q) and moderate ones fixed in 6.28. It imports only `Headers`, as a polyfill for Node < 18 | #326 Slice 7 | `@connectrpc/connect-node` asks for `undici` ≥ 6.28 |
| `lodash-es` | 4.18.1 | `chevrotain` 11.1 (under `mermaid` > `langium`) pins `lodash-es` 4.17.23: GHSA-r5fr-rjxr-66jc (high), GHSA-f23m-r3pf-42rh | #326 Slice 7 | `mermaid` no longer brings a `chevrotain` that pins `lodash-es` ≤ 4.17.23 |
| `vitest` | 5.0.1 | One hoisted `vitest` for the repo-root tools (nonreg shared runner, `scripts/tests`): `@copilotkit/channels-core` 0.11 (under `@copilotkit/runtime`) declares an optional `vitest` `^4.0.0` peer, which otherwise keeps vitest 5 out of the root `node_modules` | #374 | `@copilotkit/channels-core` accepts `vitest` 5 |

## Vendored packages

Packages the npm registry does not carry in a fixed version are committed under [`vendor/`](vendor/) and installed with a `file:` spec. `package-lock.json` records the tarball's SHA-512, so `npm ci` refuses a tarball that changed.

| Package | Tarball | Source | SHA-512 (`sha512sum`) | Used by |
|---|---|---|---|---|
| `xlsx` (SheetJS) | `vendor/xlsx-0.20.3.tgz` | `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`; the registry stops at 0.18.5, which has GHSA-4r6h-8v6p-xvw6 and GHSA-5pgg-2g8v-p4x9 (high) | `a0b0eade3c3b01c2ea2961f60210a9553665f267fa5f661178ff8d7a1d12254cd5fc1759623b61f78b46e6da22301d4f3eb62dc4e09f6a850292fb6e1fedc024` | `miroir-standalone-app` (`Importer.tsx`, `ImportEntityFromSpreadsheetRunner.tsx`) |

To update a vendored package: download the new tarball from its source, replace the file, update the spec in the manifest, run `npm install`, and update the table.
