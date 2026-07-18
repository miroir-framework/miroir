# Analysis — UI integ without `@testing-library/react`

**Feature:** [#197](./plan.md) Phase B  
**Symptom:** Network tab on Run Integration loads `@testing-library_react.js` (~1.6 MB) from Vite deps  
**Policy (locked for now):** React-component integ (e.g. JzodElementEditor) is **Vitest/Node (or dedicated harness) only** — not runnable through Miroir UI until a later design.  
**Companion:** [analysis-emulated-deployment-controller-gap.md](./analysis-emulated-deployment-controller-gap.md)

---

## 1. Verdict

`@testing-library/react` enters the **browser** because the UI integ launch module graph **statically imports** `tests-utils.tsx`, which begins with a top-level RTL import — even though Feature 197’s UI-runnable suite (`runner_library` / Return Book) is **headless** (`domainController` + composite actions) and never calls `render()`.

RTL is a **devDependency**. Loading it via production-style dynamic import of the launcher is accidental coupling, not a product requirement.

---

## 2. Import chain (Network tab matches code)

```text
RunMiroirTestSuiteButton.tsx
  dynamic import → uiIntegrationTestLauncher.ts
  dynamic import → loadBrowserUiIntegrationTestLauncherEnvironment.ts
    dynamic import → standaloneAppBrowserIntegrationOrchestrator.ts
      static import → tests/helpers/RunnerTestSession.ts
        static import → tests/helpers/appStackIntegrationBootstrap.ts
          static import → src/miroir-fwk/4-tests/tests-utils.js
            top-level → @testing-library/react  (render / RenderOptions)
```

Evidence points:

| Step | File | Mechanism |
|------|------|-----------|
| Button | `RunMiroirTestSuiteButton.tsx` ~146–149 | `import()` launcher + env |
| Orchestrator | `standaloneAppBrowserIntegrationOrchestrator.ts` | value-import `RunnerTestSession` from `tests/helpers` |
| Bootstrap | `appStackIntegrationBootstrap.ts` | value-import `createMiroirDeploymentGetPersistenceStoreController` from `tests-utils` |
| Harness | `tests-utils.tsx` L1–2 | `import { render } from '@testing-library/react'` |

### Critical nuance

`RunnerTestSession` uses `deployMiroirStrategy: "compositeAction"`. The imported helper `createMiroirDeploymentGetPersistenceStoreController` runs **only** for `"persistenceStoreControllerHelper"`. So for Return Book:

- **Module evaluate:** yes (pulls RTL)  
- **Runtime call:** no  

Splitting the helper file removes RTL from the browser graph without changing runner behavior.

---

## 3. What else `tests-utils.tsx` pulls (browser-hostile)

Beyond RTL:

| Surface | Risk for UI integ graph |
|---------|-------------------------|
| `renderWithProviders` / `…WithContextProvider` | React test harness; Vitest-only purpose |
| `miroir-react` LocalCache / context providers | Fine for app code; wrong **seam** when bundled via test utils |
| Hard-coded SQL / legacy deployment fixtures in module body | Wrong profile for browser IndexedDB path |
| Seed / teardown / deployment constant exports | Used by Node `4_storage` Vitest; force whole module if co-located with RTL |

Already on the UI chain (related, not RTL):

| Module | Note |
|--------|------|
| `RunnerIntegTestTools.tsx` | `document.body.innerHTML = ""` — DOM OK, not RTL |
| `setupMiroirTest.ts` | Emulate stack setup; required for runner |
| `IntegrationTestSession.ts` | `node:path` — **must stay** off browser graph (already avoided by browser orchestrator) |

---

## 4. Suite classification

### 4.1 Need RTL (stay Vitest / file-based)

| Suite / area | Why |
|--------------|-----|
| `JzodElementEditor.test.tsx` | Component DOM |
| `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` | B6-d1 **proof clicks UI** — RTL in the **test file**, not in the leaf |
| `DomainController.React.*.test.tsx` | `renderWithProviders` |
| Other `4_view` component integ | Classic RTL |

These must keep importing RTL **from the test file** (or `tests-utils.tsx`). They must **not** force RTL into the Miroir UI launcher chunk.

### 4.2 Do **not** need RTL for leaf execution (UI-runnable candidates)

| Kind | Example | Bootstrap |
|------|---------|-----------|
| `sessionKind: "runner"` | `runner_library` Lend/Return Book | Headless composite actions |
| Future transformer MiroirTest | B7 | Headless (browser-safe session — no `node:path`) |
| Non-React DomainController integ | many `3_controllers` | Headless |

Current UI registry only exposes `runner_library` (`uiIntegrationTestRunnerSuiteRegistry.ts`). Launcher rejects other session kinds.

### 4.3 Node / PersistenceStoreController-direct (never MiroirTest UI for Phase B)

`4_storage` / filesystem / SQL driver suites that need Node PersistenceStoreControllerManager or Node-only factories. Keep CLI/Vitest. Do not put them in the UI registry.

---

## 5. How Vitest Node path uses the same chain (must keep working)

| Entry | Path |
|-------|------|
| B3 Node launcher | `runUiIntegrationTestSuiteInNode` → full orchestrator → `RunnerTestSession` → bootstrap |
| CLI / `Runner_Miroir.integ.test.tsx` | direct `RunnerTestSession` |
| Storage PersistenceStoreController | often imports constants/teardown from `tests-utils` |

After a split, Node can:

- import deployment helpers from a new `.ts` module, and/or  
- keep `tests-utils.tsx` re-exporting those helpers for back-compat while still owning RTL.

Vitest `tests/setup.ts` already loads RTL for component suites — that must remain undisturbed.

---

## 6. Refactor options (ranked)

### Rank 1 — Lowest invasiveness (recommended first)

**Split** `createMiroirDeploymentGetPersistenceStoreController` / related non-React helpers into e.g. `deploymentTestHelpers.ts` (plain TS).  

Leave `renderWithProviders*` + RTL in `tests-utils.tsx`.  

Point `appStackIntegrationBootstrap.ts` at the `.ts` helper.

| Pro | Con |
|-----|-----|
| Unblocks UI Return Book network graph | Bootstrap still lives under `tests/helpers` (G-UI-2 not fully closed) |
| Vitest React suites unchanged | — |
| Matches “compositeAction never needed that import” | — |

### Rank 2 — Lazy import inside `persistenceStoreControllerHelper` only

`await import(…)` only when `deployMiroirStrategy === "persistenceStoreControllerHelper"`. Alone, removes RTL from runner path; still prefer Rank 1 for cleanliness.

### Rank 3 — Relocate browser-safe session + bootstrap under `src/miroir-fwk/4-tests/`

Fulfill **G-UI-2**: browser orchestrator must not value-import `tests/helpers/*`. Keep Node-only session (path, sql, filesystem) out of Vite client by structure.

### Rank 4 — Suite metadata tags + picker gating

| Tag | Purpose |
|-----|---------|
| `uiBootstrap: "browserSafe" \| "nodeStores" \| "realServerClient"` | Button enablement |
| `proofHarness: "none" \| "rtl"` | Vitest-only proof files; never required of domain leaves |
| existing `uiTransport` / session kind | Keep |

UI button reasons e.g. “Suite needs React Testing Library — Vitest only”.

### Rank 5 — Separate browser bootstrap implementation

Duplicate/adapt bootstrap for IndexedDB-only / no `filesystemDeploymentRootDirectory` assumption. Heavier; more needed for transformer / B6-c than for the RTL symptom.

**Out of scope / avoid:** promoting RTL to a production dependency to “make the import legal.”

---

## 7. Impacts on Phase B

| Item | Impact |
|------|--------|
| **B6-d2 indexedDb smoke** | RTL load is noise / risk / wrong bundle; Rank 1 is a **prerequisite for honest T3** |
| **B6-d1 RTL display proof** | Unaffected — keep RTL in the **test file** / mocks |
| **Return Book leaf** | No RTL dependency; headless |
| **G-UI-2** | Rank 1 = tactical; Rank 3 = architectural |
| **B6-c real-server** | Orthogonal; do not stick REST helpers in `tests-utils.tsx` |
| **B7 transformer** | Must avoid `IntegrationTestSession` + `node:path` **and** RTL |
| **JzodElementEditor** | Remains Vitest baseline; not UI-launcher |

---

## 8. Target policy (proposal)

```text
UI MiroirTest integ launcher
  ✓ may load: domainController, store factories registered in webApp, browser-safe bootstrap
  ✗ must not load: @testing-library/*, renderWithProviders, Node-only stores, node:path sessions

Vitest
  ✓ may load: all of the above as needed per suite
  ✓ component integ / B6-d1 continue to use RTL explicitly
```

Gate expansion of UI registry by `{ sessionKind, uiBootstrap, proofHarness }` — refuse suites with `proofHarness: "rtl"` or `uiBootstrap: "nodeStores"`.

---

## 9. Open design questions (for grilling)

1. Is Rank 1 (split helpers) enough to call G-UI-2 “closed enough for B6”, or must browser orchestrator **stop importing `tests/helpers`** (Rank 3) before B6-d2?
2. Should UI picker **hard-gate** any suite that pulls React-harness tags, even if Rank 1 lands?
3. For B7, prefer a thin browser session façade vs relocating all of `tests/helpers` under `src/`?

---

## 10. References

- `tests-utils.tsx` — top-level RTL  
- `appStackIntegrationBootstrap.ts` — import of `createMiroirDeploymentGetPersistenceStoreController`  
- `standaloneAppBrowserIntegrationOrchestrator.ts` — `tests/helpers/RunnerTestSession`  
- `uiIntegrationTestRunnerSuiteRegistry.ts` — `runner_library` only  
- `phase-b-ui-launcher-plan.md` — G-UI-2  
- Network: initiator chain ending at `@testing-library_react.js` via `tests-utils.tsx`
