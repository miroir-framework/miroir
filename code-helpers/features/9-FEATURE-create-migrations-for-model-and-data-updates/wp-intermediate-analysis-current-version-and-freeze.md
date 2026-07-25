# Intermediate WP (before WP2) — Effective Application Versions & Freeze

> **Design superseded pending #217.** Issue
> [#217](https://github.com/miroir-framework/miroir/issues/217) is now the first
> prerequisite. It makes the live `Entity` model independent from optional
> Application Version history. This document and #216 must therefore be revised:
> unversioned applications do not require a `current` Application Version, and
> versioned applications freeze live Entities into historical EntityVersions.
> See `./pre-wp2-analysis-entity-authoritative-present-model.md`.

## Topic

Make Application Version handling effective: every application always has a live **`current`** `SelfApplicationVersion` that indexes the present model via `ApplicationVersionCrossEntityDefinition`, plus a **freeze** Action that snapshots that state into a numbered Application Version.

Related:
- Parent / motivation: https://github.com/miroir-framework/miroir/issues/9
- Blocks WP2 (replayable migrations): `./wp2-analysis-application-version-migrations.md`
- WP1 (trace events): `./wp1-analysis-model-evolution-trace.md`
- GitHub issue: https://github.com/miroir-framework/miroir/issues/216

---

## 1. Why this sits between WP1 and WP2

WP1 traces model evolution events. WP2 needs Application Versions as **migration nodes** with a reliable squashed-model index.

Today, version handling is ineffective:

- Commit builds a `SelfApplicationVersion` with placeholder UUIDs / TODO names and **does not persist** it (creation path commented out in `DomainController` commit).
- Deployments often lack a coherent **live tip** version named `current`.
- `ApplicationVersionCrossEntityDefinition` exists and is partially populated for Miroir’s `"Initial"` version, but is not maintained as the authoritative “what is the model right now?” index for every app.
- Library / other apps carry placeholder version instances (`TODO: No label…`, fake `aaaaaaaa-…` FKs) and typically **no** complete cross-entity-definition set for a live tip.
- Schema vs data mismatch: EntityDefinition schema field is named `entity` (FK → Entity), while persisted cross instances use `entityDefinition` (UUID of an EntityDefinition). Intent (and WP2 diagram) is **version → Entity Definition**.

Without a real `current` + freeze, WP2 has no stable squashed baseline to attach migration edges to.

---

## 2. Target semantics

### 2.1 Always-present `current` Application Version

For each application (SelfApplication), there **must always** exist exactly one `SelfApplicationVersion` with:

- `name` = `"current"` (canonical live tip marker)
- valid `selfApplication` / `branch` (branch still linear / default for now)
- a full set of `ApplicationVersionCrossEntityDefinition` records: **one per Entity Definition that constitutes the present model** of that application

`current` is the reference point for “the model of this deployment as it is now.”

Pointers that should resolve to it (or stay consistent with it):

- `StoreBasedConfiguration.definition.currentApplicationVersion` (already modeled)
- optionally `ApplicationModelBranch.headVersion` (align or document which is authoritative — open decision)

### 2.2 Freeze Action

New Action in the Miroir app (model Action / Endpoint Action — exact packaging TBD):

**`freezeApplicationVersion`** (name TBD)

Inputs (conceptual):

- selected application (SelfApplication / deployment context)
- version number / label for the frozen snapshot (e.g. `"1.0.0"`, `"Av2"`)

Effects:

1. Create a **new** `SelfApplicationVersion` with the given version number/name (not `"current"`).
2. Set `previousVersion` to the prior frozen version if any (or leave unset / link policy TBD); do **not** replace the live tip identity of `"current"`.
3. Materialize `ApplicationVersionCrossEntityDefinition` records for that new version, copying the **Entity Definition set that `current` indexes at freeze time** (same squashed mapping).
4. Leave `"current"` in place as the continuing live tip (still named `"current"`, still updated as the model evolves).

Resulting history shape (aligns with WP2 left/right diagram):

```
… → Av1 (frozen) → Av2 (frozen) → … → current (live tip)
```

Each frozen `Avi` and `current` has its own CrossEntityDefinition rows for the Entity Definitions of that state.

### 2.3 Maintaining `current` as the model evolves

Whenever the model of an application changes in a way that changes which Entity Definitions are “in force” (create/alter/drop entity definition, etc.):

- Update `current`’s `ApplicationVersionCrossEntityDefinition` set so it always matches the present model.
- Frozen versions’ cross records remain immutable snapshots.

(Precise producer: commit path, individual model Actions, or both — open decision; freeze itself only snapshots.)

---

## 3. Functional requirements

1. **Bootstrap / init**: creating or initializing an application ensures a `current` version and a complete CrossEntityDefinition set for its initial Entity Definitions.
2. **Invariant**: for every application, exactly one version named `current` exists; its cross records cover every present model Entity Definition (no missing, no stale defs for dropped entities).
3. **Schema alignment**: `ApplicationVersionCrossEntityDefinition` must clearly reference **EntityDefinition** (fix schema/`entity` vs data/`entityDefinition` mismatch).
4. **Freeze Action**: selectable application + version label → new numbered ApplicationVersion + cross records snapshot from `current`.
5. **Idempotency / errors**: freeze with duplicate version name fails explicitly; missing `current` fails explicitly; incomplete cross set is an error (or auto-heal — prefer fail loud in tests, heal only if product decision says so).
6. **Tests**: init has `current` + cross coverage; model change updates `current` mapping; freeze produces immutable snapshot equal to `current` at that moment; `current` still exists after freeze.
7. **Fixtures**: Miroir / Library / Admin / Designer deployments brought in line (`current` instead of only `"Initial"` / TODO placeholders), or migration path from `"Initial"` → treat as first freeze / rename policy documented.

---

## 4. Out of scope

- Replayable Action payloads on trace events (WP2).
- Paired data migrations (#215).
- Application Model Branch fork/merge.
- Full migration apply planner (WP2).

---

## 5. Open decisions

1. Authoritative tip pointer: version `name === "current"` vs `StoreBasedConfiguration.currentApplicationVersion` vs `branch.headVersion` (recommend: all three kept consistent; `name === "current"` is the domain rule).
2. What happens to existing `"Initial"` versions in assets: rename to `current`, freeze as `0.0.0` / `Initial` and add new `current`, or dual-read compatibility?
3. Does freeze also stamp `ApplicationModelBranch.headVersion`?
4. Version label format (free string vs semver).
5. When Entity Definitions are versioned in place vs new UUID per evolution — cross records always point at the definition UUID that is current for each Entity.
6. Whether maintaining `current`’s cross set is done on every model Action or only on commit.

---

## 6. Suggested implementation slices

1. Fix / confirm `ApplicationVersionCrossEntityDefinition` schema (EntityDefinition FK).
2. Helpers: ensureCurrentVersion, rebuildCurrentCrossEntityDefinitions, freezeCurrentVersion.
3. Wire initModel / deployment bootstrap to create `current` + cross set.
4. Wire model evolution (commit and/or Actions) to refresh `current` cross set.
5. Add `freezeApplicationVersion` Action + Endpoint surface in Miroir.
6. Fix deployment fixtures; integration tests on Library + Miroir.
7. Document as prerequisite for WP2 / update #9 work breakdown.

---

## 7. Completion criteria

- [ ] Every application deployment under test has a `current` ApplicationVersion.
- [ ] `current` has CrossEntityDefinition coverage for all present Entity Definitions.
- [ ] Freeze creates a numbered version with a snapshot of that coverage; `current` remains.
- [ ] Schema matches persisted cross instances (EntityDefinition).
- [ ] WP2 can assume squashed-model indices exist at `current` and at each frozen version.
