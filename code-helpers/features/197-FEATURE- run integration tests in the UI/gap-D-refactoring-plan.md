# Gap D — Refactoring plan: unified integration test profiles

**Parent:** [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap D  
**Prerequisites:** [gap-E-refactoring-plan.md](./gap-E-refactoring-plan.md) ✅, [gap-B-refactoring-plan.md](./gap-B-refactoring-plan.md) ✅, [gap-A-refactoring-plan.md](./gap-A-refactoring-plan.md) ✅  
**Related:** [plan.md](./plan.md) — Feature #197 (G5 profile selection, Phase B UI profile picker)  
**Scope:** Refactor **how integration tests select store backends and config files** — not bootstrap
phases (Gap E), not playfield contracts (Gap B), not host injection (Gap A). **No `it()` body
changes.**

**Status:** Not started

---

## 1. Goal

One **`--profile`** (and one CI-friendly env story) drives **all** `miroir-standalone-app`
integration paths that today split across:

| Surface today | Used by | Selects |
|---------------|---------|---------|
| `VITE_MIROIR_TEST_CONFIG_FILENAME` + `VITE_MIROIR_LOG_CONFIG_FILENAME` | App-stack (`testByFile`), runner MiroirTest (`testMiroir`) | Full `MiroirConfigClient` JSON + logger options |
| `MIROIR_TEST_*` flat env vars | Transformer MiroirTest integ (`miroir-core-tests.integ.test.ts`) | `TestSessionForIntegOptions` for synthetic `testApplication` + admin store |

After Gap D:

```bash
# One profile → transformer + runner integ (same postgres host, same admin backend, same log preset)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql \
  --suites miroirCoreTransformers --mode integ

npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql \
  --suites runner_library --mode integ \
  --filter '{"runner.library":["Return Book Test Composite Action"]}'
```

Explicit env vars **still win** over profile defaults (locked G5 from [plan.md](./plan.md)).

Gap D **does not** merge transformer `testApplication` playfield UUIDs with deployment-library
UUIDs (intentional — see Gap B). It **aligns store backend parameters** (Postgres host, filesystem
roots, IndexedDB names, …) so CI and local dev use one matrix row per backend combination.

---

## 2. Impacted families

| Family | Config today | Gap D change |
|--------|--------------|--------------|
| **Transformer integ** (`IntegrationTestSession`) | `resolveTestSessionForIntegOptionsFromEnv(MIROIR_TEST_*)` | Profile supplies defaults; env overrides unchanged |
| **Runner MiroirTest** (`RunnerTestSession`) | `loadTestConfigFiles(VITE_MIROIR_*)`; `--profile` via `applyRunnerTestProfile` (miroir-core) | Profile sets `VITE_MIROIR_*`; same registry as transformer |
| **App-stack** (`AppStackIntegrationTestSession`, `DomainControllerIntegrationTestSession`) | `loadTestConfigFiles` in each Vitest file | Optional `--profile` via `testByFile` wrapper (slice D5); manual env unchanged |
| **`testMiroir` launcher** (`test-miroir-runner.ts`) | Routes core vs runner; profile only on runner path today | Apply profile **before** routing for any `--mode integ` run |
| **CLI / MCP** (`setupMiroirPlatform`) | Package-local config | **Out of scope** (optional slice D9) |

**Not in Gap D:** PSC→`domainController` assertions (Gap C), UI subprocess launcher (#197 Phase B),
hostMode / embedded bootstrap (Gap A).

---

## 3. Before / after architecture

### 3.1 Today

```
                    ┌── MIROIR_TEST_APP_STORE_TYPE, MIROIR_TEST_POSTGRES_HOST, …
testMiroir (core) ──┤
                    └── IntegrationTestSession → synthetic testApplication

                    ┌── VITE_MIROIR_TEST_CONFIG_FILENAME (miroirConfig.test-*.json)
testMiroir (runner) ┤   VITE_MIROIR_LOG_CONFIG_FILENAME
                    └── RunnerTestSession → full emulated stack

testByFile ───────────── loadTestConfigFiles(VITE_MIROIR_*) only — no --profile

RUNNER_TEST_PROFILES (miroir-core) ── only emulatedServer-sql; TODO paths in wrong package
```

Operators maintain **two mental models** and duplicate host defaults in CI (Postgres host in
`MIROIR_TEST_POSTGRES_HOST` **and** inside JSON connection strings).

### 3.2 Target

```
IntegrationTestProfileRegistry (standalone-app)
  emulatedServer-sql | emulatedServer-filesystem | ci-emulatedServer-host-sql | …
        │
        ├─ miroirConfigFilename
        ├─ logConfigFilename
        └─ transformerSessionDefaults?: Partial<TestSessionForIntegOptions>  // optional explicit overrides
        │
        ▼
applyIntegrationTestProfile(profileName, { respectExistingEnv: true })
        │
        ├─ sets VITE_MIROIR_* (when unset)
        └─ sets MIROIR_TEST_* defaults (when unset)
        │
        ▼
resolveTestSessionForIntegOptionsFromEnv(env)     loadTestConfigFiles(env)
        │                                                    │
        └──────────── same Postgres host / admin type ───────┘
```

**Optional deeper slice (D2):** `deriveTestSessionDefaultsFromMiroirConfig(json)` parses
`deploymentStorageConfig` from the profile’s JSON and maps:

- Admin deployment section → `adminStore` options
- Postgres connection string → `MIROIR_TEST_POSTGRES_HOST` / schema hints
- Does **not** replace `testApplication` UUIDs — only store wiring

---

## 4. Introduced contracts

All additions live in **`miroir-standalone-app`** (JSON paths and env application stay in the
adapter package). `miroir-core` keeps CLI parsing (`--profile` flag) but **not** profile tables.

### 4.1 `IntegrationTestProfile` (standalone-app)

**Location:** `packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts`

```typescript
export type IntegrationTestProfile = {
  /** Registry key, e.g. "emulatedServer-sql" */
  name: string;
  /** Relative to repo root or standalone-app package root (document one convention) */
  miroirConfigFilename: string;
  logConfigFilename: string;
  /** When set, applied before env resolution; env vars still override */
  transformerDefaults?: Partial<{
    appStoreType: "sql" | "filesystem" | "indexedDb" | "mongodb";
    adminStoreType: "filesystem" | "sql" | "indexedDb" | "mongodb" | "bundled";
    postgresHost: string;
    adminSqlSchema: string;
  }>;
  description?: string;
};

export const INTEGRATION_TEST_PROFILES: Record<string, IntegrationTestProfile> = { /* … */ };
```

**Initial catalog** (migrate + expand `RUNNER_TEST_PROFILES`):

| Profile key | Config JSON | Typical use |
|-------------|-------------|-------------|
| `emulatedServer-sql` | `miroirConfig.test-emulatedServer-sql.json` | Local default (admin FS, miroir+library PG) |
| `emulatedServer-filesystem` | `miroirConfig.test-emulatedServer-filesystem.json` | No Postgres |
| `emulatedServer-indexedDb` | `miroirConfig.test-emulatedServer-indexedDb.json` | IndexedDB backends |
| `emulatedServer-mongodb` | `miroirConfig.test-emulatedServer-mongodb.json` | MongoDB backends |
| `ci-emulatedServer-host-sql` | `miroirConfig.test-ci-emulatedServer-host-sql.json` | CI matrix |
| `ci-emulatedServer-dockerized-sql` | `miroirConfig.test-ci-emulatedServer-dockerized-sql.json` | Docker CI |

Mixed / real-server profiles: **document only** in D8 unless a slice owner adds them (real-server
needs live `miroir-server` — not suitable for transformer integ).

### 4.2 `applyIntegrationTestProfile`

**Location:** same file

```typescript
export type ApplyIntegrationTestProfileOptions = {
  /** When true (default), do not overwrite env vars already set — G5 */
  respectExistingEnv?: boolean;
};

export function applyIntegrationTestProfile(
  profileName: string | undefined,
  options?: ApplyIntegrationTestProfileOptions,
): IntegrationTestProfile | undefined;
```

Behaviour:

1. Unknown profile → throw with list of valid keys (same as today’s runner profile error).
2. If `respectExistingEnv` (default **true**):
   - Set `VITE_MIROIR_TEST_CONFIG_FILENAME` / `VITE_MIROIR_LOG_CONFIG_FILENAME` only when unset.
   - Set each mapped `MIROIR_TEST_*` only when unset.
3. Return the resolved profile (for logging / Phase B UI inspector).

### 4.3 `deriveTestSessionDefaultsFromMiroirConfig` (optional, slice D2)

**Location:** `packages/miroir-standalone-app/tests/helpers/deriveTestSessionDefaultsFromMiroirConfig.ts`

Pure function: `MiroirConfigClient` → partial env defaults for transformer session. Unit-tested
with fixtures from existing `miroirConfig.test-emulatedServer-sql.json` (no Vitest / Postgres).

When profile has no explicit `transformerDefaults`, D2 derivation fills them from JSON.

### 4.4 Launcher wiring

**`test-miroir-runner.ts`:** Call `applyIntegrationTestProfile(parseProfileArg(argv))` **once** at
startup for **all** integ routes (core + runner), before `resolveVitestEntry()`.

**`miroir-core-tests.integ.test.ts`:** No change to entry logic beyond benefiting from env already
set by launcher; direct `vitest run` on the file still requires manual env or future D5 wrapper.

**Deprecate:** `packages/miroir-core/src/5_tests/runnerTestProfiles.ts` — re-export from
standalone-app or thin forwarder for one release; remove in D7.

### 4.5 Resolution order (locked)

| Priority | Source |
|----------|--------|
| 1 (highest) | Explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` in environment |
| 2 | `--profile` / `-p` on CLI |
| 3 | No default in CI — fail fast with usage (transformer entry already validates via `assertMiroirCoreIntegTestLaunchReady`) |
| 4 (local only) | Document recommended profile in testing.md; optional dev default **not** auto-applied in CI |

---

## 5. What is intentionally NOT in Gap D

| Rejected / deferred | Reason |
|---------------------|--------|
| Single env prefix replacing both `MIROIR_TEST_*` and `VITE_MIROIR_*` | Breaking; keep both as override layers |
| Transformer integ loading full `MiroirConfigClient` for test execution | Different playfield (`testApplication`); only **defaults** converge |
| Forcing app-stack tests off JSON configs | `loadTestConfigFiles` remains canonical for emulated server wiring |
| Real-server profiles for transformer integ | Transformer uses local PSC, not HTTP — out of scope |
| `setupMiroirPlatform` (CLI/MCP) profile table | Optional D9; separate config files today |
| Auto-rewrite developer-specific paths inside JSON files | Document “fix `filesystemDeploymentRootDirectory` locally”; CI presets use portable paths |

---

## 6. Locked decisions (grill)

| # | Question | Decision |
|---|----------|----------|
| D-G1 | Profile registry home | **standalone-app** (`integrationTestProfiles.ts`) |
| D-G2 | Override precedence | **Explicit env > `--profile` > error in CI** (G5) |
| D-G3 | Transformer / app-stack store convergence | **Profile table + optional JSON derivation** — not full config unification |
| D-G4 | `testByFile --profile` | **Optional slice D5** — convenience wrapper; not required for D “done” |
| D-G5 | `RUNNER_TEST_PROFILES` in miroir-core | **Deprecate → remove** (D7); wrong layer for path constants |
| D-G6 | Mixed / real-server profiles in registry | **Document only** until a dedicated slice adds them |
| D-G7 | Phase B UI | Profiles expose `describeSession` + profile metadata for inspector — **follow-up hook only** in D8 docs |

---

## 7. TDD steps

Each slice: **Red → Green → verify regression → one commit**.

**Global regression anchors** (after slices touching shared code):

```bash
# Transformer integ (profile + env)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ

# Runner integ
VITE_MIROIR_TEST_CONFIG_FILENAME=...  # or --profile only after D1
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner_library --mode integ

# App-stack spot check
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ
# (with VITE_MIROIR_* or --profile after D5)

# Unit
npm run testByFile -w miroir-core -- parseMiroirTestCliConfig.unit
npm run testByFile -w miroir-standalone-app -- integrationTestProfiles.unit
```

---

### Slice D0 — Profile types + catalog (standalone-app, unit only)

**D0-Red:** `integrationTestProfiles.unit.test.ts`

- `INTEGRATION_TEST_PROFILES.emulatedServer-sql` paths exist and end in `.json`
- Unknown profile throws from `applyIntegrationTestProfile("nope")`
- `respectExistingEnv: true` does not overwrite pre-set `VITE_MIROIR_TEST_CONFIG_FILENAME`

**D0-Green:** `integrationTestProfiles.ts` with catalog migrated from `RUNNER_TEST_PROFILES`

**Verify:** unit only

**Commit:** `refactor(integ-test): D0 integration test profile catalog`

---

### Slice D1 — Unified `--profile` on `testMiroir` launcher

**D1-Red:** `test-miroir-runner.profile.unit.test.ts` (extract `resolveVitestEntry` helpers or test via spawn mock)

- `--profile emulatedServer-sql` sets both `VITE_MIROIR_*` and `MIROIR_TEST_POSTGRES_HOST` (or derived default) on spawn env when unset
- Transformer route (`--suites miroirCoreTransformers`) receives same env as runner route

**D1-Green:**

- `test-miroir-runner.ts`: call `applyIntegrationTestProfile` before routing
- Remove duplicate `applyRunnerTestProfile` call from `parseMiroirRunnerTestCliConfig` (profile applied at launcher only)

**Verify:** regression anchors (transformer + runner)

**Commit:** `refactor(integ-test): D1 apply profile for all testMiroir integ routes`

---

### Slice D2 — Derive transformer defaults from `miroirConfig` JSON (unit)

**D2-Red:** `deriveTestSessionDefaultsFromMiroirConfig.unit.test.ts`

- Given `miroirConfig.test-emulatedServer-sql.json` fixture → `postgresHost`, `adminStoreType: filesystem`
- Missing deployment sections → partial result, no throw

**D2-Green:** implement pure mapper; wire into `applyIntegrationTestProfile` when `transformerDefaults` omitted

**Verify:** D0 + D2 unit; transformer integ still green with `--profile` only (no manual `MIROIR_TEST_POSTGRES_HOST`)

**Commit:** `refactor(integ-test): D2 derive transformer session defaults from miroir config`

---

### Slice D3 — Profile-aware launch validation

**D3-Red:** extend `miroirCoreIntegTestLaunch.unit.test.ts`

- Usage text mentions `--profile emulatedServer-sql`
- When profile applied, validation passes without explicit `MIROIR_TEST_POSTGRES_HOST`

**D3-Green:** update `formatMiroirCoreIntegTestUsage` + optional profile hint in error messages

**Verify:** launch unit tests

**Commit:** `docs(integ-test): D3 profile in launch validation and usage`

---

### Slice D4 — CI preset profiles + matrix doc

**D4-Green:**

- Add `ci-emulatedServer-host-sql`, `ci-emulatedServer-dockerized-sql` to catalog
- Document single GitHub Actions matrix row in `docs/reference/testing.md`:

```yaml
# Example CI row (illustrative)
profile: emulatedServer-sql
run: |
  npm run testMiroir -w miroir-standalone-app -- --profile ${{ matrix.profile }} \
    --suites miroirCoreTransformers --mode integ
  npm run testMiroir -w miroir-standalone-app -- --profile ${{ matrix.profile }} \
    --suites runner_library --mode integ
```

**Verify:** manual or CI dry-run

**Commit:** `chore(ci): D4 integration test profile matrix documentation`

---

### Slice D5 — Optional `testByFile --profile` convenience (standalone-app)

**D5-Red:** unit test for wrapper script or npm pre-step

**D5-Green:** either:

- `scripts/test-by-file-with-profile.ts` sets env then spawns vitest, or
- document `npm run testByFile -- --profile X` if implemented in existing script

**Scope:** convenience only; manual `VITE_MIROIR_*` remains supported

**Commit:** `feat(integ-test): D5 testByFile profile convenience`

---

### Slice D6 — Remove `runnerTestProfiles` from miroir-core (D7)

**D6-Green:**

- Delete or thin-forward `miroir-core/src/5_tests/runnerTestProfiles.ts`
- Update exports in `miroir-core/index.ts`
- Fix any imports (launcher uses standalone-app catalog)

**Verify:** full regression anchors + `npm run devBuild -w miroir-core`

**Commit:** `refactor(integ-test): D7 remove runner profile table from miroir-core`

---

### Slice D8 — Documentation + gap closure

**D8-Green:**

- [docs/reference/testing.md](../../../docs/reference/testing.md) — “Integration profiles” section
- [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) §5 → **Done** with link here
- [plan.md](./plan.md) Gap D success criteria checked off

**Commit:** `docs(integ-test): D8 unified profile documentation`

---

### Slice D9 — CLI/MCP alignment (optional)

Adopt `INTEGRATION_TEST_PROFILES` in `setupMiroirPlatform` or document explicit non-goal.

**Defer** unless CLI integ tests need the same CI matrix.

---

## 8. Success criteria

- [ ] One `--profile emulatedServer-sql` runs **both** `miroirCoreTransformers` and `runner_library` without duplicate env vars
- [ ] Explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` still override profile (unit-tested)
- [ ] Profile catalog lives in **standalone-app**; miroir-core has no filesystem path constants for profiles
- [ ] CI matrix documented with one profile column driving transformer + runner
- [ ] `docs/reference/testing.md` describes resolution order and profile catalogue
- [ ] (Optional D5) `testByFile` can use `--profile` for app-stack tests

---

## 9. Relationship to Feature #197

| #197 item | Gap D contribution |
|-----------|-------------------|
| G5 env + `--profile` | Delivers unified profile for **all** integ families, not runner-only |
| Phase B UI profile picker | `INTEGRATION_TEST_PROFILES` + `describeSession` metadata = catalog for UI |
| Phase B isolated subprocess | Launcher already sets env via profile before spawning Vitest — unchanged |

Gap D is **not blocking** Phase B launcher work (Gaps A/B/E already unblocked bootstrap). It
**reduces CI/local friction** and gives Phase B a single profile list to expose.

---

## 10. Suggested commit sequence (summary)

1. `refactor(integ-test): D0 integration test profile catalog`
2. `refactor(integ-test): D1 apply profile for all testMiroir integ routes`
3. `refactor(integ-test): D2 derive transformer session defaults from miroir config`
4. `docs(integ-test): D3 profile in launch validation and usage`
5. `chore(ci): D4 integration test profile matrix documentation`
6. `feat(integ-test): D5 testByFile profile convenience` (optional)
7. `refactor(integ-test): D7 remove runner profile table from miroir-core`
8. `docs(integ-test): D8 unified profile documentation`

---

## Related

- [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap D problem statement
- [plan.md](./plan.md) — Feature #197 Phase A/R/B; G5 profile decision
- [gap-E-refactoring-plan.md](./gap-E-refactoring-plan.md) — bootstrap (prerequisite)
- [docs/reference/testing.md](../../../docs/reference/testing.md) — operator reference (update in D8)
