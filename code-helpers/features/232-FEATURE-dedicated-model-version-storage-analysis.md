# 232 — Analysis: dedicated storage section for model-version history

## Summary

Issue 232 proposes a first-class `model-version` deployment section for storing historical model snapshots separately from the live `model` section. The workflow/versioning proposal in [docs/getting-started/workflow-and-versioning.md](c:/Users/nono/Documents/devhome/miroir-app-dev-copilot/docs/getting-started/workflow-and-versioning.md) treats this as a core requirement for internal versioning: the live application model stays in `model`, while version history is kept in `model-version`.

## Decision record

- Decision: adopt Option A and make `model-version` a first-class storage section end to end.
- Rationale: the workflow/versioning doc explicitly describes `model-version` as a dedicated store section, and the current versioning helpers already have a natural seam for routing historical snapshots to a dedicated location.
- Consequences: the storage contract becomes slightly broader, but the architecture becomes explicit and easier to reason about than encoding this as a special case in `model`.
- Scope of this ADR: storage contract, persistence backends, versioning write-paths, tests, and documentation. It does not attempt to define full rollback/branch semantics beyond persisting version-history separately.

## Current state in the repository

- The versioning design already distinguishes between live model content and historical snapshots. The workflow doc says internal version history should live in the `model-version` store section.
- The current storage contract only exposes three sections: `admin`, `model`, and `data`. The shared type in [packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts](c:/Users/nono/Documents/devhome/miroir-app-dev-copilot/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts) defines `ApplicationSection` as `"model" | "data"`.
- Deployment configuration objects also assume only these three sections. The generated type for store section configuration in the same file exposes `admin`, `model`, and `data` fields.
- The persistence startup code registers factories only for `model` and `data` for filesystem and SQL backends in [packages/miroir-store-filesystem/src/startup.ts](c:/Users/nono/Documents/devhome/miroir-app-dev-copilot/packages/miroir-store-filesystem/src/startup.ts) and [packages/miroir-store-postgres/src/startup.ts](c:/Users/nono/Documents/devhome/miroir-app-dev-copilot/packages/miroir-store-postgres/src/startup.ts).
- The freeze/versioning helpers already decide where to write historical model entities. The write-section resolution logic in [packages/miroir-core/src/1_core/Model.ts](c:/Users/nono/Documents/devhome/miroir-app-dev-copilot/packages/miroir-core/src/1_core/Model.ts) and the freeze implementation in [packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts](c:/Users/nono/Documents/devhome/miroir-app-dev-copilot/packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts) are the central entry points for this behavior.

## Impact analysis

### 1. Shared type and configuration contract

This is the broadest change. A new `model-version` section must be introduced as a first-class `ApplicationSection`, and the deployment configuration model must be updated to allow a fourth section alongside `admin`, `model`, and `data`.

Impact:
- Core generated types and possibly the runtime schema will need to change.
- Any code that assumes only `model` and `data` will need to be audited.
- The change touches the public-facing storage contract, so it should be treated as a cross-cutting architectural change rather than a localized patch.

### 2. Persistence backends

Each backend will need to understand the new section. The filesystem and SQL store startups currently register section factories only for `model` and `data`, so the new section will not be usable until those factories are added.

Impact:
- Backend implementations must be able to create and read a distinct `model-version` store section.
- Existing `model` and `data` behavior must remain unchanged.
- A minimal first implementation can reuse the existing model-store storage logic under a different section label, but the contract should remain explicit.

### 3. Versioning write paths

Freeze-related code already resolves a section per historical entity family. That logic should be updated so historical snapshots write to `model-version` rather than being implicitly routed through the live `model` section.

Impact:
- Version snapshots will become distinguishable from live model definitions.
- Read paths and query logic should be reviewed so they can consume the new section when needed.
- The change should be limited to version-history persistence; live model definitions and application data should continue to use their existing sections.

### 4. Runtime and UI consumption

The current runtime flow for loading configuration and reading sections is centered around the existing `model` / `data` split. Introducing a third section means that any logic that assumes only two sections may need adjustment.

Impact:
- Loading and rollback flows may need to consider `model-version` when versioning is enabled.
- UI/reporting features that inspect the model history will need a clear way to target the new section.
- This can be implemented incrementally, but the storage contract should be made explicit first.

### 5. Tests and documentation

The change should be covered by tests that prove the new section is distinguishable from `model`, and the deployment documentation should reflect the new storage layout.

Impact:
- At least one backend path should be exercised in tests.
- The existing storage architecture doc should be updated so the new section is documented with the same clarity as `model` and `data`.

## Architectural options

### Option A — Full first-class section (recommended)

Add `model-version` as a proper section in the contract and wire it through the persistence stack and versioning helpers.

Pros:
- Matches the workflow/versioning design directly.
- Keeps live model and version history separate at the storage layer.
- Makes the architecture explicit and future-proof.

Cons:
- Requires broader cross-cutting changes.
- Touches generated types and several backends.

### Option B — Reuse `model` with a versioning flag

Continue to use the existing `model` section but encode “version-history” semantics with an additional flag or metadata.

Pros:
- Smaller implementation effort.
- Avoids contract changes.

Cons:
- Does not match the documented architecture.
- Makes storage semantics ambiguous and harder to maintain.

### Option C — Store version history in `data`

Use `data` as the storage location for historical snapshots.

Pros:
- Minimal implementation change.

Cons:
- Weakens the conceptual separation between live model definitions and historical data.
- Diverges from the versioning design and likely creates confusion later.

## Recommended approach

Implement Option A with a narrow first slice:

1. Introduce `model-version` as an explicit `ApplicationSection` in the core type contract.
2. Extend the deployment configuration model so each deployment can define a `model-version` section alongside `admin`, `model`, and `data`.
3. Register a dedicated store section factory for filesystem and SQL backends, using the same persistence behavior as the existing model-store path but with a distinct section identity.
4. Update the freeze/versioning write-path helpers so historical snapshots use `model-version` while live model writes continue to use `model`.
5. Add tests and documentation for the new section, starting with one backend path.

This approach keeps the change aligned with the workflow/versioning proposal while limiting the initial scope to storage and versioning persistence behavior.

## Risks

- The storage contract is generated and shared widely, so type updates may have broader impact than expected.
- Some runtime code may implicitly assume only two application sections and could silently mis-handle the new one.
- The new section should be introduced carefully to avoid accidentally changing the storage location of live model definitions.
- Backend behavior and tests must be kept consistent across filesystem and SQL paths to avoid feature drift.

## Bottom line

The repository is structurally ready for this change at the level of versioning logic and persistence startup hooks, but the current contract still hard-codes only `model` and `data`. The cleanest implementation is to make `model-version` a first-class section end to end rather than trying to encode it as a special case inside the existing `model` section.
