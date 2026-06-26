# Gap A — Refactoring plan: skip platform bootstrap when host is live

**Parent:** [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap A  
**Prerequisites:** [gap-E-refactoring-plan.md](./gap-E-refactoring-plan.md) ✅, [gap-B-refactoring-plan.md](./gap-B-refactoring-plan.md) ✅ (L0–L8)  
**Related:** [plan.md](./plan.md) — Feature #197 Phase B (UI launcher); Gap D (profile unification)  
**Scope:** Pure refactoring of **bootstrap wiring** — when to call `setupMiroirTest`, when to run
`deployMiroir`, and when to accept an injected host `domainController`. **No `it()` body changes.**

**Status:** Gap A **complete** (A0–A5, A8). A6 skipped (store startup dedup). A7 skipped (CLI/MCP). A9 deferred (#197 Phase B).

---

## 1. Goal

Let integration tests run in two **host modes** without forking per-family setup code:

| Mode | Who provides platform | Bootstrap behaviour |
|------|----------------------|---------------------|
| **`isolated`** (CLI / Vitest default) | Test runner | Full `wireEmulatedStack` + `deployMiroir` (+ library phases per session kind) — **unchanged** |
| **`embedded`** (live Miroir UI host) | `miroirAppStartup` / `setupMiroirPlatform` already ran | **Skip** re-wiring and re-deploying Miroir meta-application; **inject** host `domainController` + deployment map |

Gap A makes the split between:

1. **Adapter setup** — store registration, config, `DomainController` wiring (`wireEmulatedStack`).
2. **Platform deployment** — Miroir meta-application (`deployMiroir`; admin store is filesystem/bundled asset, not re-created by composite action in app-stack path).

machine-readable and controllable from `MiroirTestIntegrationOrchestrator` context — the same port
#197 Phase B will call.

Gap A **does not** implement the UI launcher, session mutex, or isolated Vitest subprocess. It
**prepares** the orchestrator + bootstrap contract those features plug into.

### Relationship to #197 Phase B

[plan.md](./plan.md) Phase B **B0** recommends **isolated** execution first (spawn Vitest / separate
schema — never touch the live `MiroirContext`). That path keeps `hostMode: "isolated"` and remains
the default regression anchor.

**Embedded** mode is still required for:

- Future in-browser integ runs that deliberately reuse the host stack (advanced / Electron IPC).
- Documenting why `deployMiroir` must not run against a live session.
- Uniform orchestrator API whether the launcher spawns a child process or attaches to the host.

---

## 2. Impacted families

| Family | Platform bootstrap today | Gap A change |
|--------|-------------------------|--------------|
| **App-stack integ** (`4_storage`, CRUD, undo-redo) | Per-file `miroirAppStartup` + session `initSession` → `wireEmulatedStack` + `deployMiroir` | Orchestrator `hostMode: "embedded"` skips phases; inject host env |
| **Runner MiroirTest** | `RunnerTestSession` → bootstrap `runner` phases | Same context flags |
| **Transformer integ** | `IntegrationTestSession` — local PSC, no `wireEmulatedStack` | **Out of embedded scope** — always `isolated`; synthetic `testApplication` |
| **CLI / MCP** | `setupMiroirPlatform` (parallel to `setupMiroirTest`) | Optional slice — align with `ensureMiroirPlatform` helper |
| **Live UI** (`miroirAppStartup`) | Already provisioned | Consumer of `embedded` mode via #197 Phase B |

**Not in Gap A:** library playfield idempotency (Gap B ✅), PSC assertion migration (Gap C),
`MIROIR_TEST_*` / `VITE_MIROIR_*` unification (Gap D), transformer ↔ library UUID convergence.

---

## 3. Before / after architecture

### 3.1 Today (post Gap E + Gap B)

```
Per-file module setup (duplicated)
  miroirAppStartup() + store section startups
  loadTestConfigFiles(VITE_MIROIR_*)

session.initSession()
  runAppStackIntegrationBootstrap(phases)
    wireEmulatedStack     → setupMiroirTest (always)
    deployMiroir          → createMiroirDeployment… / compositeAction (always when phase present)
    deployLibrary         → ensureLibraryPlayfield(mode: playfieldMode ?? createIfAbsent)
    resetMiroirModel      → optional
```

No way to pass the host `domainController` from a running UI session. Re-running `deployMiroir`
against live meta-model stores is destructive.

### 3.2 Target (Gap A complete)

```
IntegrationTestHostMode ("isolated" | "embedded")
        │
        ▼
IntegrationTestOrchestratorContext
  hostMode?: IntegrationTestHostMode           // default "isolated"
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>
  skipBootstrapPhases?: IntegrationTestBootstrapPhase[]
  platformEnsureMode?: MiroirPlatformEnsureMode  // deployMiroir idempotency
        │
        ▼
runAppStackIntegrationBootstrap(phases, hostContext)
  if hostMode === "embedded" && hostExecutionEnvironment:
    skip wireEmulatedStack — use injected domainController + PSC manager
  for each phase in phases filtered by skipBootstrapPhases:
    deployMiroir → ensureMiroirPlatform({ mode: platformEnsureMode ?? createIfAbsent })
    deployLibrary → ensureLibraryPlayfield({ mode: playfieldMode … })  // Gap B
        │
        ▼
MiroirTestExecutionEnvironment (unchanged shape)
```

**Phase filter precedence:**

1. Explicit `skipBootstrapPhases` on context (UI catalog / advanced).
2. `hostMode: "embedded"` implies default skip: `wireEmulatedStack`, `deployMiroir` (when host env injected).
3. `platformEnsureMode: "requireExisting"` — `deployMiroir` becomes assert-only (no composite action).

---

## 4. Introduced contracts (miroir-core)

All additions are **additive**. `RunnerTestSessionInterface` method signatures stay unchanged.

### 4.1 `IntegrationTestHostMode` + platform ensure mode

**Location:** `packages/miroir-core/src/5_tests/IntegrationTestBootstrap.ts` (or new `MiroirPlatformPlayfield.ts` if file grows)

```typescript
export type IntegrationTestHostMode = "isolated" | "embedded";

export type MiroirPlatformEnsureMode =
  | "createIfAbsent"   // CLI default — run deployMiroir when phase present
  | "requireExisting"  // embedded UI — miroir deployment must already exist
  | "skip";            // phase present in descriptor but explicitly no-op
```

### 4.2 Extend `IntegrationTestOrchestratorContext`

**Location:** `packages/miroir-core/src/5_tests/MiroirTestIntegrationOrchestrator.ts`

```typescript
export type IntegrationTestOrchestratorContext = {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  playfieldMode?: LibraryPlayfieldEnsureMode;        // Gap B ✅

  /** Gap A */
  hostMode?: IntegrationTestHostMode;
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>;
  skipBootstrapPhases?: readonly IntegrationTestBootstrapPhase[];
  platformEnsureMode?: MiroirPlatformEnsureMode;
  hostApplicationDeploymentMap?: ApplicationDeploymentMap;
};
```

`hostApplicationDeploymentMap` — deployment map from the live UI when it differs from test JSON
(e.g. user working on a fork). Optional; defaults to session options map.

### 4.3 `ensureMiroirPlatform` (miroir-core)

Mirror of `ensureLibraryPlayfield` (Gap B):

```typescript
export type EnsureMiroirPlatformParams = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  miroirDeploymentUuid: Uuid;
  miroirSelfApplicationUuid: Uuid;
  mode: MiroirPlatformEnsureMode;
  deployStrategy: DeployMiroirStrategy; // passed through from bootstrap
  persistenceStoreControllerManager?: PersistenceStoreControllerManagerInterface;
};

export async function ensureMiroirPlatform(params): Promise<{ created: boolean }>;
```

| Mode | Behaviour |
|------|-----------|
| `createIfAbsent` | PSC / composite deploy only when miroir deployment record absent |
| `requireExisting` | throw if miroir deployment not initialised |
| `skip` | no-op |

**Unit-tested in `miroir-core`** with mocked `domainController` — no `miroir-standalone-app` imports.

### 4.4 `runAppStackIntegrationBootstrap` extensions

**Location:** `packages/miroir-standalone-app/tests/helpers/appStackIntegrationBootstrap.ts`

```typescript
export type AppStackBootstrapOptions = {
  // … existing fields …
  hostMode?: IntegrationTestHostMode;
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>;
  skipBootstrapPhases?: readonly IntegrationTestBootstrapPhase[];
  platformEnsureMode?: MiroirPlatformEnsureMode;
};
```

**`wireEmulatedStack` branch:**

```typescript
if (hostMode === "embedded" && hostExecutionEnvironment?.domainController) {
  domainController = hostExecutionEnvironment.domainController;
  persistenceStoreControllerManager = hostExecutionEnvironment.persistenceStoreControllerManager
    ?? throw;
} else if (!skipBootstrapPhases?.includes("wireEmulatedStack")) {
  ({ domainController, … } = await setupMiroirTest(…));
}
```

**`deployMiroir` branch:** replace unconditional deploy with `ensureMiroirPlatform`.

### 4.5 Session adapters

Each session forwards orchestrator context fields into `runAppStackIntegrationBootstrap`:

| Session | Forwards from context |
|---------|----------------------|
| `AppStackIntegrationTestSession` | `hostMode`, `platformEnsureMode`, `playfieldMode`, `hostExecutionEnvironment`, `skipBootstrapPhases` |
| `DomainControllerIntegrationTestSession` | same |
| `RunnerTestSession` | same |
| `IntegrationTestSession` | **ignores** embedded flags (local PSC path) |

Optional **readonly** on sessions:

```typescript
readonly hostMode: IntegrationTestHostMode;
```

Filled from constructor / orchestrator — useful for UI inspector (#197 B1).

### 4.6 `describeSession` metadata (UI catalog)

Extend descriptor (additive):

```typescript
export type IntegrationTestSessionDescriptor = {
  kind: IntegrationTestSessionKind;
  bootstrapPhases: readonly IntegrationTestBootstrapPhase[];
  playfield: IntegrationTestPlayfield;
  defaultHostMode: IntegrationTestHostMode;  // transformer → isolated; app-stack → isolated; embedded-capable
  embeddedCapable: boolean;                  // false for transformer
};
```

#197 UI uses `embeddedCapable` + `playfield` to show which suites can run against host vs require subprocess.

---

## 5. Consistency with Gap E and Gap B

| Gap | Seam used by Gap A |
|-----|-------------------|
| **E** | `runAppStackIntegrationBootstrap(phases)` — Gap A adds host branches inside existing phases |
| **B** | `playfieldMode` / `ensureLibraryPlayfield` — embedded UI uses `requireExisting` for library **and** `requireExisting` for miroir platform |
| **B** | `resetLibraryPlayfield` — still runs in `beforeEach` for test isolation even in embedded mode (reset **data**, not recreate deployments) |

**Embedded mode does not disable `beforeEach` resets.** It only prevents destructive `deployMiroir` /
`wireEmulatedStack` in `initSession`.

---

## 6. TDD steps

**Baseline:** Record pass counts from Gap B regression matrix §8 before first Gap A slice.

**miroir-core unit tests** (no standalone-app deps):

```bash
npm run testByFile -w miroir-core -- IntegrationTestBootstrap.unit
npm run testByFile -w miroir-core -- MiroirTestIntegrationOrchestrator.unit
npm run testByFile -w miroir-core -- MiroirPlatformPlayfield.unit   # new
```

**After `miroir-core` export changes:** `npm run build -w miroir-core`

**Constraint:** Pure refactoring — only `beforeAll` / `beforeEach` / `afterAll` / session helpers;
no `it()` body edits.

---

### Slice A0 — Host mode types + descriptor metadata — ✅ **DONE**

**A0-Red:** `IntegrationTestBootstrap.unit.test.ts`

- `defaultHostMode` is `"isolated"` for all kinds.
- `embeddedCapable` is `false` for `transformer`, `true` for `appStackPsc`, `domainController`, `runner`.

**A0-Green:** Add `IntegrationTestHostMode`, extend `IntegrationTestSessionDescriptor`, export from `index.ts`.

**Verify:** miroir-core unit only.

---

### Slice A1 — `ensureMiroirPlatform` (miroir-core unit) — ✅ **DONE**

**A1-Red:** `packages/miroir-core/tests/5-tests/MiroirPlatformPlayfield.unit.test.ts`

| Case | Expectation |
|------|-------------|
| `createIfAbsent`, absent | deploy composite / PSC path called once |
| `createIfAbsent`, present | no-op; `{ created: false }` |
| `requireExisting`, absent | throws descriptive error |
| `skip` | no-op |

**A1-Green:** `packages/miroir-core/src/5_tests/MiroirPlatformPlayfield.ts` (+ export).

**Verify:** `MiroirPlatformPlayfield.unit` only.

---

### Slice A2 — Bootstrap host injection + phase filter (unit) — ✅ **DONE**

**A2-Red:** `appStackIntegrationBootstrap.unit.test.ts`

- `hostMode: "embedded"` + injected `domainController` → `setupMiroirTest` **not** called.
- `skipBootstrapPhases: ["deployMiroir"]` → deploy skipped; wire still runs (isolated).
- `platformEnsureMode: "requireExisting"` with absent deployment → throws.

**A2-Green:** Implement branches in `runAppStackIntegrationBootstrap`; `deployMiroir` delegates to `ensureMiroirPlatform`.

**Verify:** `appStackIntegrationBootstrap.unit` + build miroir-core.

---

### Slice A3 — Orchestrator context forwarding — ✅ **DONE**

**A3-Green:** `StandaloneAppIntegrationOrchestrator` passes `hostMode`, `platformEnsureMode`,
`hostExecutionEnvironment`, `skipBootstrapPhases`, `hostApplicationDeploymentMap` into session
constructors.

**A3-Red:** orchestrator + `DomainControllerIntegrationTestSession` unit tests assert host context
reaches bootstrap.

**Verify:** `StandaloneAppIntegrationOrchestrator.unit`, `DomainControllerIntegrationTestSession.unit`,
`MiroirTestIntegrationOrchestrator.unit`.

### Slice A4 — Session adapter wiring — ✅ **DONE** (wired in A3)

**A4-Green:** `AppStackIntegrationTestSession`, `DomainControllerIntegrationTestSession`,
`RunnerTestSession` accept optional host fields (from orchestrator or direct construction for
per-file Vitest — default `isolated`).

**Verify (spot-check):**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ

npm run testByFile -w miroir-standalone-app -- DomainControllerIntegrationTestSession.unit
```

---

### Slice A5 — Embedded mode characterization test (new unit) — ✅ **DONE**

**A5-Red:** `embeddedIntegrationBootstrap.unit.test.ts` (standalone-app)

- Mock host `domainController` + `persistenceStoreControllerManager`.
- `runAppStackIntegrationBootstrap({ hostMode: "embedded", phases: appStackPsc phases, platformEnsureMode: "requireExisting", playfieldMode: "requireExisting" })` completes without `setupMiroirTest` / deploy composite spies.

**A5-Green:** Implementation hardened from A2–A4.

**Verify:** new unit file only (no integ regression required for A5).

---

### Slice A6 — Optional: module-level startup deduplication — **SKIPPED**

**Scope:** Many integ files duplicate:

```typescript
miroirAppStartup();
miroirCoreStartup();
miroir*StoreSectionStartup(…);
```

**Only if low conflict:** extract `registerIntegrationTestStoreSections()` helper called from vitest
`setupFiles` or session `initSession` when `hostMode === "isolated"`.

**Skip slice** if it touches every integ file — defer to Gap E Slice S style.

---

### Slice A7 — CLI / MCP alignment (optional) — **SKIPPED**

If `setupMiroirPlatform` duplicates `deployMiroir` logic inline:

- Route through `ensureMiroirPlatform` + shared types.
- **Skipped:** high conflict — separate packages, duplicate `setupMiroirPlatform` copies.

---

### Slice A8 — Docs + gap analysis — ✅ **DONE**

- Update `docs/reference/testing.md` — host modes table, orchestrator context fields.
- Update `integ-test-setup-gaps.md` Gap A → done.
- Cross-link #197 Phase B B0 (isolated subprocess vs embedded).
- Update `gap-B-refactoring-plan.md` §4.4 (remove “document only” — implemented).

**Verify:** docs only.

---

### Slice A9 — #197 Phase B launcher hook (thin, optional in Gap A) — **DEFERRED**

**Not full UI** — only the adapter port:

```typescript
// miroir-standalone-app — future UI module
createEmbeddedIntegrationTestSession(
  kind: IntegrationTestSessionKind,
  hostEnv: MiroirTestExecutionEnvironment,
): RunnerTestSessionInterface
```

Wraps `createStandaloneAppIntegrationOrchestrator().createSession(kind, {
  hostMode: "embedded",
  hostExecutionEnvironment: hostEnv,
  platformEnsureMode: "requireExisting",
  playfieldMode: "requireExisting",
  miroirConfig: hostEnv.internalMiroirConfig ?? …,
})`.

**Defer** full `RunMiroirTestSuiteButton` / mutex to #197 Phase B proper.

---

## 7. What is intentionally NOT done in Gap A

| Item | Reason |
|------|--------|
| UI subprocess launcher / mutex | #197 Phase B |
| Transformer integ embedded mode | Local PSC / synthetic UUIDs — always isolated |
| Skip `beforeEach` data resets | Test isolation — resets stay; only platform **create** is skipped |
| Merge `setupMiroirPlatform` (CLI) and `setupMiroirTest` (tests) into one module | Large blast radius; optional A7 only |
| Real-server (`emulateServer: false`) embedded mode | Host is always emulated or IPC in scope; real-server tests stay CLI-only |
| Gap D profile unification | Separate plan |

---

## 8. Regression matrix (final)

| Suite | Expected |
|-------|----------|
| Transformer integ | 243/243 (unchanged — isolated only) |
| 4_storage ×3 | 10 + 11 + 7 |
| DomainController CRUD ×5 + undo-redo | same pass count as pre-Gap-A |
| Runner_Miroir + `runner_library` MiroirTest | same |
| `MiroirPlatformPlayfield.unit` | all cases |
| `appStackIntegrationBootstrap.unit` | prior cases + host mode cases |
| miroir-core existing units | no mock breakage |

---

## 9. Success criteria

- [x] `IntegrationTestHostMode` + `MiroirPlatformEnsureMode` exported from `miroir-core`
- [x] `ensureMiroirPlatform` unit-tested without standalone-app imports
- [x] `runAppStackIntegrationBootstrap` supports embedded injection + phase skip + `ensureMiroirPlatform`
- [x] Orchestrator context documents and forwards host fields
- [x] `describeSession` exposes `embeddedCapable` for UI catalog
- [ ] CLI default (`isolated`) — full regression matrix §8 green
- [x] Embedded characterization unit proves no `setupMiroirTest` / deploy on host path
- [x] `RunnerTestSessionInterface` method signatures unchanged
- [x] No `it()` body edits
- [x] Gap A docs + `integ-test-setup-gaps.md` updated

---

## 10. Seamless path to #197 Phase B

After Gap A + Gap B + Gap E:

```
UI Test Launcher (#197 Phase B)
  │
  ├─ Subprocess (recommended): hostMode isolated, fresh schema — unchanged CLI bootstrap
  │
  └─ Embedded (advanced): hostMode embedded
        createSession(kind, {
          hostExecutionEnvironment: fromMiroirContext(uiMiroirContext),
          platformEnsureMode: "requireExisting",
          playfieldMode: "requireExisting",
          skipBootstrapPhases: ["wireEmulatedStack", "deployMiroir"],
        })
        describeSession(kind) → { playfield, embeddedCapable, bootstrapPhases }
```

Gap B made **library** playfield machine-readable. Gap A makes **platform** bootstrap
machine-readable and safe against a live host.
