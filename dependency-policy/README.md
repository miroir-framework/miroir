# Dependency policy data

Data read by `scripts/check_dependency_policy.py` and the reasons behind root `package.json` entries that JSON cannot comment. The policy itself: [docs/contributing/development-setup.md](../docs/contributing/development-setup.md), Dependency policy. Design: [#326 analysis](../code-helpers/features/326-BUILD-build-hardening/analysis.md).

## Root `overrides`

An override forces one version of a package everywhere in the tree, whatever its parents ask for. Each one is listed here; remove it once the "remove when" condition holds, and run `python scripts/check_dependency_policy.py` afterwards.

| Package | Version | Why | Added | Remove when |
|---|---|---|---|---|
| `rxjs` | 7.8.2 | One RxJS instance for the app and CopilotKit / AG-UI, which each asked for their own 7.8.1 copy | e3e3c32 ("deduped RxJS"), pinned in #326 | no dependency pins an `rxjs` version other than ours |
| `yaml` | 2.8.4 | One `yaml` 2.x across the tree: `cosmiconfig` 7 (under `babel-plugin-macros`) asks for `^1.10.0`; also overrides the `2.9.0` pin of `nx` 23 (lerna 10) | 190d5ec (#246), pinned in #326 | no dependency asks for `yaml` 1.x |
| `lerna` > `js-yaml` | 4.3.2 | `lerna` 10.0.1 pins `js-yaml` 4.3.0: GHSA-2883-xcg3-v3hh, GHSA-5p4m-2wfm-xmqj (high) | #326 Slice 6 | `lerna` pins `js-yaml` ≥ 4.3.2 |
| `lerna` > `pacote` | 21.5.1 | `lerna` 10.0.1 pins `pacote` 21.0.1: GHSA-w4pp-8pjf-rmxw (high) | #326 Slice 6 | `lerna` pins `pacote` ≥ 21.5.1 |
| `nx` > `smol-toml` | 1.7.1 | `nx` 23.2.1 (under `lerna`) pins `smol-toml` 1.6.1: GHSA-7w5x-hrqm-74c2 (high) | #326 Slice 6 | `nx` pins `smol-toml` ≥ 1.7.1 |
