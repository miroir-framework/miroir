# Dependency policy data

Data read by `scripts/check_dependency_policy.py` and the reasons behind root `package.json` entries that JSON cannot comment. The policy itself: [docs/contributing/development-setup.md](../docs/contributing/development-setup.md), Dependency policy. Design: [#326 analysis](../code-helpers/features/326-BUILD-build-hardening/analysis.md).

## Root `overrides`

An override forces one version of a package everywhere in the tree, whatever its parents ask for. Each one is listed here; remove it once the "remove when" condition holds, and run `python scripts/check_dependency_policy.py` afterwards.

| Package | Version | Why | Added | Remove when |
|---|---|---|---|---|
| `rxjs` | 7.8.2 | One RxJS instance for the app and CopilotKit / AG-UI, which each asked for their own 7.8.1 copy | e3e3c32 ("deduped RxJS"), pinned in #326 | no dependency pins an `rxjs` version other than ours |
| `yaml` | 2.8.4 | One `yaml` 2.x across the tree: `cosmiconfig` 7 (under `babel-plugin-macros`) asks for `^1.10.0`; also overrides the `2.9.0` pin of `nx` 23 (lerna 10) | 190d5ec (#246), pinned in #326 | no dependency asks for `yaml` 1.x |
