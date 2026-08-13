# Deployment package Version History inventory

Published as part of **versioning modes and asset migration**. Tracks where Version History instance JSON lives in each deployment package's `assets/` tree, the effective `versioningMode`, and follow-up work outside the Miroir reference deployment.

Runtime routing uses the `modelVersion` store section for all `versionHistoryEntityUuids` entities (see `packages/miroir-core/src/1_core/Model.ts`). Git assets should mirror that split when a package ships version history.

## Summary table

| Package | Version History asset location | `versioningMode` | Status |
|---|---|---|---|
| `miroir-test-app_deployment-miroir` | `assets/miroir_modelVersion/` — EntityVersion (34), SelfApplicationVersion (2), ApplicationVersionCrossEntityVersion (7) | `versioned-internal` | **Done** — reference layout; filesystem bootstrap seeds `modelVersion`; bundled profile omits section; versioning menus/reports wired to `modelVersion` |
| `miroir-test-app_deployment-admin` | — (no EntityVersion instance JSON) | **`unversioned`** | **Done** — schema on Entity rows only; no freeze |
| `miroir-test-app_deployment-library` | — (no EntityVersion instance JSON) | **`unversioned`** | **Done** — schema on Entity rows only; bundled meta-model `applicationVersions: []` |
| `miroir-test-app_deployment-designer` | — (no EntityVersion instance JSON) | **`unversioned`** | **Done** — schema on Entity rows only |
| `miroir-test-app_deployment-postgres` | — (no EntityVersion instance JSON) | **`unversioned`** | **Done** — schema on Entity rows only |

## Notes

- **Legacy rule:** when `versioningEnabled: true` and `versioningMode` is absent, treat as `versioned-internal` (same as explicit internal mode for runtime freeze gates).
- **Unversioned satellite apps:** domain schema lives on **Entity** rows under `*_model/16dbfe28…/` (`mlSchema`, view attributes, etc.). No per-entity **EntityVersion** JSON and no **SelfApplicationVersion** JSON in git assets.
- **Entity metaclass rows** for Version History *types* (EntityVersion, SelfApplicationVersion, ApplicationVersionCross*, …) live in the Miroir deployment package under `miroir_model/16dbfe28…/` — other packages reference those metaclass rows, not duplicate Entity JSON.
- **Bundled / sandbox:** Miroir bundled profile has **no** `modelVersion` section and **no** Version History instances in bundled `model` or `data` (read-only live model + data only).
- **`versioned-external`:** not used by any deployment package today; history would live in Git with no writable Miroir `modelVersion` section.

## Asset folder convention

| Folder | Purpose |
|---|---|
| `{prefix}_model/` | Live model — Entity rows, Reports, Queries, Menus, SelfApplication, present-model EntityVersion schema snapshots |
| `{prefix}_data/` | Application/domain data instances |
| `{prefix}_modelVersion/` | Version History snapshots for **`versioned-internal`** apps only |
| `{prefix}_admin/` or nested admin sections | Admin deployment only |

Miroir deployment prefixes: `miroir_model`, `miroir_data`, `miroir_modelVersion`.

## Follow-up (post-#234)

If admin, library, designer, or postgres are later reclassified as `versioned-internal` or `versioned-external`, revisit: relocate freeze-history rows to `*_modelVersion/`, restore versioning menus, and wire deployment store configs — out of scope for the closed #234 slice.
