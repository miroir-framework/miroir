# Preliminary analysis: platform user and rights model in Admin app (prep for #71)

Issue tracked by: https://github.com/miroir-framework/miroir/issues/219  
Parent feature: https://github.com/miroir-framework/miroir/issues/71  
Implementation plan: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md)

## Intent

Prepare the Miroir platform for future authentication and authorization (Feature #71) by adding:

1. A **platform user** concept.
2. A **platform rights** concept enabling assignment of application-level and deployment-level access intent.
3. Initial admin-app model and display capabilities to inspect and manage these concepts.

This issue is explicitly **preparatory only**: no access control checks are enforced yet.

## Why this belongs in Admin

The Admin deployment is the central place that stores and presents:

- known applications,
- known deployments and their configuration,
- cross-application platform-level administration data.

Platform user and rights concepts are platform-level administration concepts and therefore fit in the Admin application model and data.

## Scope

### Covered use cases (in-scope)

1. Define a `MiroirUser` entity in Admin model with baseline identity/profile attributes.
2. Define a `MiroirRight` entity in Admin model to represent intended access grants.
3. Support grants at two scopes:
   - **Application scope** (user can perform operation(s) on an application),
   - **Deployment scope** (user can perform operation(s) on a deployment).
4. Model relationships between users and rights in a way consistent with Miroir entities.
5. Add/update admin reports/menus/views to:
   - list users,
   - list rights,
   - show rights per user,
   - show target application/deployment of each right.
6. Add seed/sample data so the new model can be explored immediately in Admin UI.
7. Ensure model/data are loadable across supported stores (filesystem, sql, indexedDb, bundled where applicable).

### Excluded use cases (out-of-scope)

1. Authentication mechanisms (login flow, password/passkey/OIDC/JWT/session handling).
2. Any runtime authorization enforcement in DomainController, stores, endpoints, queries, transformers, or UI routes/actions.
3. Role inheritance, policy engines, or ABAC/RBAC evaluation runtime.
4. User provisioning workflows (invite/activation/recovery), secrets management, or credential storage.
5. Auditing/compliance features (access logs, approval trails, recertification workflows).
6. Migration of existing deployments to mandatory secure mode.

## Naming decision (documented and justified)

To reduce cross-domain name-clash risk, keep platform concepts explicit in the admin meta-model:

1. **Use prefixed entity names in model language**
   - `MiroirUser`
   - `MiroirRight` (singular entity name; UI labels may say "Users" / "Rights")
2. **Keep field names bland/standard when possible**
   - Examples: `name`, `status`, `targetType`, `targetUuid`, `capability`, `description`.
   - Avoid over-prefixing every attribute unless collision pressure appears.
3. **Use standard UI labels where clarity helps**
   - Display label can remain "Users" / "Rights" in menus and reports.
   - The technical entity identifiers stay explicit (`MiroirUser`, `MiroirRight`).

Justification:

- **Collision resistance:** avoids confusion with application-level entities named `User`, `Right`, `Role`, etc.
- **Searchability:** `Miroir*` names make platform-security model artifacts easier to locate in assets/code.
- **Interoperability:** allows future external app models to keep conventional names without aliasing.
- **Pragmatism:** preserve familiar, bland attribute names for readability and lower cognitive overhead.

## Dividing choices — decided defaults

All six dividing choices are closed for #219. Defaults are intentionally dull: one entity where one suffices, standard fields, minimal UI, no fancy taxonomy until enforcement (#71) needs it.

| ID | Choice | Accepted for #219 | Rejected / deferred | Why (dull path) |
|---|---|---|---|---|
| C1 | Rights entity naming & shape | **`MiroirRight`**, **single** grants entity | `MiroirUserRight`, `MiroirAccessGrant`; split app/deployment entities | Shortest clear prefixed name; one table for both scopes; rename later only if language conflicts appear |
| C2 | Capability representation | **free-string** `capability` | enum-like controlled set; structured `{domain,action,constraints}` | Prep only needs readable placeholders; taxonomy belongs with enforcement in #71 |
| C3 | Target reference shape | **polymorphic** `targetType` + `targetUuid` | separate nullable `applicationUuid`/`deploymentUuid`; dedicated target entity | Common pattern; one FK column; no null-pair XOR rules; no extra entity |
| C4 | Subject reference | **`miroirUser` FK only** | group/role subjects now | Users first; groups/roles are a later model extension if product needs them |
| C5 | UI scope | **list + detail reports** (menus wired); edit via **existing generic instance editors** if already available | custom CRUD forms / dedicated editors | Enough to inspect seed data; avoid bespoke UI work in a prep issue |
| C6 | Versioning / migration | **direct** admin model + data asset addition | staged migration Action packages for this greenfield add | Admin fixtures are source-of-truth assets; no live-upgrade story required for #219 |

### C1 — Rights entity naming and normalization

**Accepted:** entity name `MiroirRight`; one grants entity covering both application and deployment scopes via `targetType`.

| Option | Verdict |
|---|---|
| `MiroirRight` + single entity ★ | Accepted |
| `MiroirUserRight` | Rejected — redundant once subject is always a user (C4) |
| `MiroirAccessGrant` | Rejected — longer synonym; no clarity gain for prep |
| Split ApplicationRight / DeploymentRight | Rejected — duplicates schema; scope is a field, not two types |

### C2 — Capability representation

**Accepted:** plain string attribute `capability` (e.g. `"read"`, `"write"`, `"admin"` in seed data — illustrative only).

| Option | Verdict |
|---|---|
| Free-string ★ | Accepted for #219 |
| Controlled enum / literal union | Deferred to #71 when allow/deny semantics harden |
| Structured capability object | Deferred — overbuilt before any evaluator exists |

### C3 — Target reference shape

**Accepted:** `targetType: "application" | "deployment"` and `targetUuid` pointing at the corresponding Admin `Application` or `Deployment` instance.

| Option | Verdict |
|---|---|
| Polymorphic `targetType` + `targetUuid` ★ | Accepted |
| Separate nullable app/deployment FKs | Rejected — XOR nulls are easy to get wrong and harder to report |
| Dedicated target / indirection entity | Rejected — extra hop with no benefit before enforcement |

**Convention:** for `targetType === "application"`, `targetUuid` references an Admin Application instance; for `"deployment"`, a Deployment instance. Seed data must use real existing UUIDs.

### C4 — Subject-reference pattern

**Accepted:** each `MiroirRight` has a required foreign key `miroirUser` → `MiroirUser`.

| Option | Verdict |
|---|---|
| User-only subject ★ | Accepted |
| Subject polymorphism (user \| group \| role) now | Deferred — no group/role entities in this issue |

### C5 — UI scope for this prep issue

**Accepted:** Admin menu entries + list report + detail report for `MiroirUser` and `MiroirRight` (rights list shows user, capability, targetType, target). Instance create/update/delete only through **generic** Miroir instance UI already used for other Admin entities — no custom forms.

| Option | Verdict |
|---|---|
| List/detail reports (+ generic editor) ★ | Accepted |
| Bespoke full CRUD screens | Rejected for #219 — outsized UI cost for prep |

### C6 — Versioning / migration strategy

**Accepted:** add Entity (+ EntityVersion as needed by current admin layout), reports, menus, and seed instances directly under `miroir-test-app_deployment-admin` assets; rebuild the package. No separate migration Action package for introducing these greenfield concepts.

| Option | Verdict |
|---|---|
| Direct asset addition ★ | Accepted |
| Staged migration assets | Deferred unless a later release needs to upgrade already-deployed Admin stores that lack these entities |

## Proposed baseline model (locked)

Reflects C1–C6. No allow/deny engine; records are declarative only.

### MiroirUser (Admin data entity)

| Attribute | Type / notes |
|---|---|
| `uuid` | UUID primary key (default Miroir PK) |
| `name` | display name (required) |
| `status` | string, seed values `"active"` / `"inactive"` (free-string; dull) |
| `description` | optional string |

Optional contact fields may be added later; not required for #219.

### MiroirRight (Admin data entity)

| Attribute | Type / notes |
|---|---|
| `uuid` | UUID primary key |
| `miroirUser` | FK → `MiroirUser` (C4) |
| `targetType` | `"application"` \| `"deployment"` (C3) |
| `targetUuid` | UUID of Application or Deployment (C3) |
| `capability` | free-string (C2) |
| `description` | optional string |

Seed data: at least two users; at least one application-scoped right and one deployment-scoped right; FKs resolve to existing Admin Application/Deployment instances.

## Gap analysis

### Current gaps to fill

1. No Admin-level canonical `MiroirUser` entity for platform actors.
2. No Admin-level canonical `MiroirRight` entity tied to application/deployment targets.
3. No illustrative capability strings in seed data (formal taxonomy deferred to #71 — C2).
4. No admin report focused on "who can do what on which app/deployment".
5. No documented contract linking future enforcement points to modeled rights data (this analysis + seed conventions).
6. No seed fixtures demonstrating multi-user / multi-scope grant scenarios.

### Integration gaps to watch

1. Consistent reference strategy to existing `Application` and `Deployment` entities (`targetType` + `targetUuid` — C3).
2. Compatibility with non-UUID and composite-key support where relevant (default UUID PK for both entities in #219; revisit only if needed).
3. Clarity of capability semantics for #71 (document that strings are provisional — C2).
4. Backward compatibility for existing admin UI flows and load sequence.
5. Bundled/demo classification: new entities live in Admin **data** section (like Application / Deployment), not model-only parentUuid sets, unless admin packaging conventions require otherwise — verify in Phase 5 of the plan.

## Expected validation conditions

### Model and data validation

1. Admin deployment model contains valid `MiroirUser` / `MiroirRight` entities and schemas with successful build/generation.
2. Admin deployment data includes valid sample `MiroirUser` and `MiroirRight` instances.
3. Referential links resolve: `miroirUser` → user; `targetUuid` → Application or Deployment per `targetType`.

### Runtime and UI validation

1. Admin app startup and rollback load the new model/data without regression.
2. List/detail reports render users, rights, capability, and target scope clearly (C5).
3. Generic instance editing (if used) works for these entities without custom form code.

### Non-regression validation

1. Existing admin model/data features remain operational.
2. No authorization behavior changes anywhere in runtime (explicitly unchanged).
3. Existing integration and targeted tests pass after introducing model/display additions.

## Deliverable boundaries for this preliminary issue

This preliminary issue is complete when:

1. `MiroirUser` and `MiroirRight` concepts exist in Admin model/data (C1–C4, C6).
2. Admin UI can list/detail and inspect them meaningfully (C5).
3. Future #71 implementation can consume the modeled rights without renaming core concepts.
4. No enforcement logic is introduced yet.

## Follow-up after this issue

Feature #71 can then focus on:

1. Authentication strategy and identity proofing.
2. Binding authenticated principal to modeled `MiroirUser`.
3. Authorization enforcement points and evaluation semantics (including hardening C2 capability taxonomy if needed).
4. Test matrix for allow/deny behavior across application/deployment boundaries.
5. Optional later extensions: group/role subjects (revisit C4), structured capabilities (revisit C2), staged Admin upgrades (revisit C6).
