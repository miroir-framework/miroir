# Deployment package Version History inventory

Published as part of **versioning modes and asset migration**. Tracks where Version History instance JSON lives in each deployment package's `assets/` tree, the effective `versioningMode`, and follow-up work outside the Miroir reference deployment.

Runtime routing uses the `modelVersion` store section for all `versionHistoryEntityUuids` entities (see `packages/miroir-core/src/1_core/Model.ts`). Git assets should mirror that split when a package ships version history.

## Summary table

| Package | Version History asset location | `versioningMode` (current / proposed) | Follow-up |
|---|---|---|---|
| `miroir-test-app_deployment-miroir` | `assets/miroir_modelVersion/` — EntityVersion (34), SelfApplicationVersion (2), ApplicationVersionCrossEntityVersion (7) | `versioned-internal` / `versioned-internal` | **Done (#234)** — reference layout; filesystem bootstrap seeds `modelVersion`; bundled profile omits section |
| `miroir-test-app_deployment-admin` | `assets/admin_model/` — EntityVersion (8), SelfApplicationVersion (1) | *(absent, legacy)* / `versioned-internal` | Relocate VH rows to `admin_modelVersion/`; set `versioningMode` on SelfApplication row |
| `miroir-test-app_deployment-library` | `assets/library_model/` — EntityVersion (6), SelfApplicationVersion (2) | *(absent, legacy)* / `versioned-internal` | Relocate to `library_modelVersion/`; add explicit `versioningMode`; wire test configs |
| `miroir-test-app_deployment-designer` | `assets/designer_model/` — EntityVersion (5), SelfApplicationVersion (1) | *(absent, legacy)* / `versioned-internal` | Relocate to `designer_modelVersion/`; add explicit `versioningMode` |
| `miroir-test-app_deployment-postgres` | `assets/postgres_model/` — EntityVersion (3), SelfApplicationVersion (1) | *(absent, legacy)* / `versioned-internal` | Relocate to `postgres_modelVersion/`; add explicit `versioningMode`; align SQL seed paths |

## Notes

- **Legacy rule:** when `versioningEnabled: true` and `versioningMode` is absent, treat as `versioned-internal` (same as explicit internal mode for runtime gates).
- **Entity definitions** for all Version History entity types (EntityVersion, SelfApplicationVersion, Historical*Version, ApplicationVersionCross*) live only in the Miroir deployment package under `miroir_model/16dbfe28…/` — other packages reference those metaclass rows, not duplicate Entity JSON.
- **Bundled / sandbox:** Miroir bundled profile has **no** `modelVersion` section and **no** Version History instances in bundled `model` or `data` (read-only live model + data only).
- **`versioned-external`:** not used by any deployment package today; history would live in Git (`assets/*_model/` + committed tags) with no writable `modelVersion` section in Miroir stores.

## Asset folder convention (target)

| Folder | Purpose |
|---|---|
| `{prefix}_model/` | Live model — Entity rows, Reports, Queries, Menus, SelfApplication, … |
| `{prefix}_data/` | Application/domain data instances |
| `{prefix}_modelVersion/` | Version History snapshots (EntityVersion, SelfApplicationVersion, ApplicationVersionCross*, …) |
| `{prefix}_admin/` or nested admin sections | Admin deployment only |

Miroir deployment prefixes: `miroir_model`, `miroir_data`, `miroir_modelVersion`.
