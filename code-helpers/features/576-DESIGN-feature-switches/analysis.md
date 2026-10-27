# 576 Feature switches: inventory and first roadblocks

> Inventory of every mechanism that turns a part of Miroir on or off today (lazy loading, process capabilities, environment detection, authentication, per-application modes, UI toggles, diagnostics), and the first roadblocks on the way to footprint profiles (a plain runtime vs an application-editing platform) and to continuous-delivery style enablement (a feature merged dark, then turned on in steps).

**Document role:** survey analysis. It states the current state and the roadblocks, and frames the decisions to take. It records no decision: goals and decision frames below are drafts to confirm with A.

Survey of `_integration` at c61c724 (2026-10-25).

## Related

- Issue: https://github.com/miroir-framework/miroir/issues/576
- [#273](https://github.com/miroir-framework/miroir/issues/273) process capability switches, [analysis](../273-FEATURE-process-capability-switches/analysis.md) (decisions D1 to D15 reused below)
- #321 / #345 environments, [analysis](../321-BUILD-environment-configuration/analysis.md), [#345 analysis](../345-BUILD-runtimes-adopt-environments/analysis.md)
- #326 / #337 / #370 bundle size, [#337 analysis](../337-BUILD-bundle-size-cuts/analysis.md)
- #244 lazy CopilotKit, #409 Claude agent backend, #286 component test chunk
- Reference docs: [process-capabilities.md](../../../docs/reference/process-capabilities.md), [environments.md](../../../docs/reference/environments.md), [code-splitting.md](../../../docs/internals/code-splitting.md)
- Key sources: [processCapabilities.ts](../../../packages/miroir-core/src/1_core/processCapabilities.ts), [ProcessCapabilitiesHttp.ts](../../../packages/miroir-core/src/4_services/ProcessCapabilitiesHttp.ts), [tools.ts](../../../packages/miroir-core/src/tools.ts) (`getClientEnvironment`), [AccessPolicy.ts](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts), [bundle-policy.json](../../../packages/miroir-standalone-app/bundle-policy.json), [storesOnDemand.ts](../../../packages/miroir-standalone-app-electron/src/storesOnDemand.ts)

## 1. Goals (draft, to confirm)

| # | Name | Story |
|---|---|---|
| G1 | Plain runtime | In order to run an application on a small device or a public site, as an application operator, I can deploy a Miroir runtime that loads and ships only what is needed to display and use applications, without the model editors, the AI assistant or the test tooling. |
| G2 | Editing platform | In order to design applications, as an application designer, I can run the full platform with every editing tool, on the same applications and stores as the plain runtime. |
| G3 | Pay on use | In order to start working quickly, as an application user, I download a feature's code only when I first use that feature. |
| G4 | Dark launch | In order to merge a feature before it is ready, as a Miroir maintainer, I can ship code with its feature off, and the CI proves it stays off and that the rest still works. |
| G5 | Gradual enablement | In order to limit the effect of a faulty feature, as an operator, I can turn a feature on for some users, applications or environments first, and turn it off again without a rebuild. |
| G6 | One place per switch | In order to add or remove a switch without hunting for it, as a Miroir maintainer, I declare a switch once (name, default, scope, what it loads, what it refuses) and every host reads that declaration. |
| G7 | Visible state | In order to know what a running process does, as a developer or an agent, I can list every switch of a process with its value and where the value came from. |

## 2. Non-goals

- Replacing libraries (ag-grid, MUI, CopilotKit) to get smaller: #337 non-goal, still out of scope.
- Choosing a third-party flag service (LaunchDarkly, Unleash, GrowthBook). The analysis can compare them when the decision frames are taken; no adoption here.
- User preferences (theme, grid type, panel positions): they are not feature switches (section 4.8).
- The Vite 8 / Rolldown migration.

## 3. Vocabulary

The word "feature" covers several kinds of switch in the code today. This analysis keeps them apart:

| Kind | Who sets it | When it can change | Examples today |
|---|---|---|---|
| Load boundary | the code (a dynamic `import()`) | never; it fires on first use | `React.lazy` routes, `ensureYamlParser()`, `registerStoreOnDemand` |
| Build profile | the build (`define`, `resolve.alias`) | per build | `MIROIR_IS_SANDBOX`, `nodeStoreStub.js` alias |
| Process capability | the environment definition, or the registered factories | at process start | `features.ai`, `features.mcp`, `availableStoreTypes` |
| Access right | Admin data (`MiroirRight`) | at runtime | `designerTools` with authentication on |
| Application mode | the SelfApplication row | at runtime | `versioningMode` |
| UI toggle | the user, in `sessionStorage` | at runtime, per tab | `showModelTools`, `showDebugInfo` |
| Diagnostic | an environment variable | at process start | `MIROIR_EVOLUTION_TRACE`, `VITE_PERFORMANCE_TRACKING` |

G1 to G3 need load boundaries and build profiles tied to capabilities. G4 and G5 need capabilities that can change after start and that can be scoped. Today each kind has its own module, its own interface and its own source of values.

## 4. Current state

### 4.1 Process capabilities (#273)

The one module that looks like a feature-switch system. A switch is read from the `features` object of the persistence-side config, turned into a snapshot at start, served to the UI, and checked again on the action path.

```
environments/<env>.json  "features": { ai, mcp, agentBackend, agentModel, designerTools }
  └─ miroir-env resolver → MiroirConfigServer.features        (environmentState.ts:215, 350)
       └─ getProcessCapabilities({ config, environment, factory registers })  (processCapabilities.ts:84)
            ├─ GET /capabilities  (server.ts:328, RestClientStub, Electron IPC)
            │    └─ UI: fetchProcessCapabilities → MiroirContext.processCapabilities → hide
            └─ DomainController.setProcessCapabilities → assertProcessCapability → refuse
                 (Action2Error "FeatureUnavailable", errorContext.capability)
```

| Capability | Source | Default when absent | Hides | Refuses | Defers loading |
|---|---|---|---|---|---|
| `ai` | `features.ai`, vetoed when `getClientEnvironment() === "sandbox"` | false | AI AppBar icons | CopilotKit route not mounted (404) | yes: client `AgentsCopilotKit` chunk (`RootComponent.tsx:613`), server `import("miroir-ai")` (`mountCopilotKitRoute.ts:40`) |
| `mcp` | `features.mcp` | false | MCP runners | `runMcpToolRunner` refuses | no: `miroir-mcp` is a static import of `server.ts:88`; only the HTTP routes are not mounted |
| `agentBackend` | `features.agentBackend` (`features.cursor` alias) | `"none"` | backend picker | `/api/copilotkit` 403 | yes: only the picked SDK, on the first agent request |
| `designerTools` | `features.designerTools`, plus an Admin `MiroirRight` when authentication is on | true | AppBar bulb, model-scope menus (`AppBar.tsx`, `Sidebar.tsx`, `SidebarSection.tsx`) | no route check: `PageDispatcher.tsx:171` renders `TransformerBuilderPage` for any user who opens its URL | no |
| `availableStoreTypes`, `creatableStoreTypes` | derived from the registered store factories | registered set | Create Application backend picker | `createStore` of an unregistered type | Electron only (`registerStoreOnDemand`); the server imports all four store packages (`server.ts:90-93`) |
| `storeAdministration` | derived: a non-`bundled` admin store factory | derived | store admin actions | create, delete, reset | n/a |

Values are booleans (plus one enum), process-wide, and read once: "Restart the process after you edit flags" (`process-capabilities.md`). The UI keeps the snapshot it fetched before login.

### 4.2 Where a capability is declared

Adding one capability today touches seven places by hand:

| # | Place | What it holds |
|---|---|---|
| 1 | `getMiroirFundamentalMlSchema.ts:1981` (`miroirConfigClient.features`) | ML schema copy 1 |
| 2 | `getMiroirFundamentalMlSchema.ts:2043` (`miroirConfigServer.features`) | ML schema copy 2 |
| 3 | `getMiroirFundamentalMlSchema.ts:2204` (`miroirEnvironment.features`) | ML schema copy 3 |
| 4 | `processCapabilities.ts:12-39` | `ProcessCapabilities`, `ProcessCapabilityName`, a hand-written `ProcessCapabilitiesConfig` |
| 5 | `processCapabilities.ts:84-104` | default and veto of each capability, in code |
| 6 | `ProcessCapabilitiesHttp.ts:8` | `FAIL_CLOSED_PROCESS_CAPABILITIES` |
| 7 | `docs/reference/process-capabilities.md` | the synoptic table, written by hand |

Plus the gate itself in each consumer (component, action, route mount). The three schema copies are identical today; nothing keeps them so.

### 4.3 Load boundaries (#244, #337, #370)

| Mechanism | Where | Tied to a capability? |
|---|---|---|
| `React.lazy` routes | `PageDispatcher.tsx:37-47` (11 routes) | no |
| `React.lazy` shell features | `RootComponent.tsx:10, 85, 86` | `AgentsCopilotKit` only, on `ai` |
| `React.lazy` heavy components | `LazyGrids.tsx`, CodeMirror (`CodeBlock_ReadOnly`, `MlElementEditorReactCodeMirror`) | no (`gridType` picks the grid) |
| `ensureX()` conditional dynamic import | `SecretsService.ts` (`node:crypto`), `syncExternalServiceSchema.ts` (`yaml`), `ModelUpdate.ts` (`json-diff`) | no |
| Factory loaded on first call | `miroir-store-indexedDb` (web), `registerStoreOnDemand` (Electron main) | derives `availableStoreTypes` |
| Server dynamic import | `mountCopilotKitRoute.ts:40` (`miroir-ai`) | `ai`, `agentBackend` |
| Component test chunk | `ComponentTestSandbox.tsx` `prepareComponentTests()` | no (first component test run) |
| Self-test | `index.tsx:459` `import("./…/startSelfTest.js")` | `client.selfTest.enabled` |

The bundle guard (`scripts/check_bundle_policy.py`, `bundle-policy.json`) keeps these boundaries: `forbiddenEager` (18 patterns), `eagerGzipBaseline` 824806 bytes, `eagerPackageMaxBytes` for `miroir-app-miroir`, `defeatedDynamicImports`. It measures one build: the standalone app with every feature compiled in.

### 4.4 Build profiles

| Build | Switch | Effect |
|---|---|---|
| `miroir-standalone-app` (web, also packaged into Electron: `electron-builder` copies `../miroir-standalone-app/dist`) | `__MIROIR_CLIENT_CONFIG__` injected by `vite/environmentConfig.js`; `nodeStoreStub.js` and `lodashMergeShim.js` aliases when `command === "build"` | one client config baked into `dist`; Node store drivers removed |
| `miroir-sandbox` | `define: { 'import.meta.env.MIROIR_IS_SANDBOX': 'true' }` (`vite.config.js:27`), source of the standalone app through the `@miroir-app` alias | `ai` vetoed; bundled stores |
| `miroir-server` release (ncc) | none | everything compiled in |
| Electron main (esbuild, `bundle-main.mjs`) | none; packaged builds ship no agent SDK (`assertAgentSdkPackaged`) | everything else compiled in |
| Docker image | `AGENT_BACKEND` build argument | which agent SDK the image installs |
| vitest | `VITE_TEST_MODE`, `MIROIR_AUTH_ENABLED` defines (`vite.config.js:209-210`) | progressive render off, component test mode |

No build profile removes a feature's code because a capability is off: a capability is a runtime value, so its code stays in the build, lazy or not.

### 4.5 Environment detection

`ClientEnvironment = "webApp" | "electron" | "node" | "sandbox"` mixes the platform (Node, browser, Electron renderer) with a product shape (sandbox). It is computed in three ways:

| Place | Test |
|---|---|
| `tools.ts:33` `getClientEnvironment()` | `import.meta.env.MIROIR_IS_SANDBOX` truthy → sandbox; `process.versions.node` → node; `window.electronAPI.callMiroirIpc` → electron; `window.document` → webApp |
| `index.tsx:122` `isElectron` | `window.process.versions.electron` |
| `index.tsx:396` `isElectron` | `window.electronAPI.callMiroirIpc` is a function |
| `AgentsCopilotKit.tsx:48`, `AiActionsProvider.tsx:658` `isStaticDemo` | `MIROIR_IS_SANDBOX === "true"` (strict, unlike `tools.ts`) |

The sandbox veto on `ai` works because the sandbox page computes its own snapshot (`miroir-sandbox/src/index.tsx:180`). On `miroir-server` and Electron main `getClientEnvironment()` returns `"node"`, so the veto never applies there; `DomainController.ts:252` also calls it at module load.

### 4.6 Authentication and access

| Switch | Precedence |
|---|---|
| Authentication on/off | CLI `--enable-auth` / `--disable-auth`, then `MIROIR_AUTH_ENABLED`, then `server.authentication.enabled` (`AuthenticationPolicy.ts:50-69`) |
| MCP authentication | `MIROIR_MCP_AUTH_ENABLED`, then `server.authentication.mcp`, then the global switch (`AuthenticationPolicy.ts:94-111`) |
| Designer tools per user | `isDesignerToolsVisible({ designerTools, authEnabled, principal, grants })` (`AccessPolicy.ts:91`): with authentication on, an explicit Admin-application `MiroirRight` grant |

`designerTools` is the only switch today that varies per user, and it does so through rights, not through the switch.

### 4.7 Per-application modes

`versioningMode` (`unversioned`, `versioned-internal`, `versioned-external`) on the SelfApplication row decides the Versioning AppBar item and `assertApplicationVersioningEnabled` (#273 D4). It is the one switch stored as model data and editable at runtime.

### 4.8 UI toggles and diagnostics (not feature switches)

- `MiroirContextReactProvider.tsx:412-463` reads nine `sessionStorage` keys (`generalEditMode`, `toolsPageState`, `showPerformanceDisplay`, `showLocalCacheMonitor`, `showActionTimeline`, `showDebugInfo`, `showModelTools`, `showAiSidebar`, `showCopilotDevConsole`). `showModelTools` is forced off when designer tools are hidden (`effectiveShowModelTools`).
- `ViewParams` (Admin data) holds user display preferences such as `gridType`.
- Diagnostic variables read at start: `MIROIR_EVOLUTION_TRACE` / `VITE_MIROIR_EVOLUTION_TRACE`, `MIROIR_SCHEMA_MODE`, `MIROIR_UI_CONTEXT`, `VITE_PERFORMANCE_TRACKING`, `VITE_MIROIR_LOG_CHUNK_LOADS`, `MIROIR_COMPONENT_PERF`, the `MIROIR_TEST_*` family.

These stay outside the switch module; the inventory lists them so that the decision on G6 says so explicitly.

### 4.9 Values per environment

Programmatic read of `environments/*.json`:

| Environment | `extends` | `features` |
|---|---|---|
| `dev` | | `ai`, `mcp` true, `agentBackend: "claude"`, `agentModel: "claude-haiku-4-5-20251001"` |
| `cloud-agent` | `dev` | `ai: false` (inherits `agentBackend: "claude"`) |
| `docker` | | `ai`, `mcp` true, `agentBackend: "none"` |
| `desktop` | | `ai`, `mcp` true |
| `self-test` | `dev` | `ai: false`; `client.selfTest` unit |
| `self-test-integ` | `self-test` | `client.selfTest` unit + integ |
| `test-filesystem`, `test-sql`, `test-indexedDb`, `test-mongodb` | (`test-filesystem`) | none: every capability at its default |

Two doc drifts found: `process-capabilities.md` says the shipped environments omit `agentBackend` except `docker`, but `dev` sets `"claude"`; and it says Electron main uses a "hardcoded `electronServerConfig` in `ipcServerSetup.ts`", while since #345 `electronServerConfig` is built from the `desktop` environment in `environmentBoot.ts:61` (adding `designerTools: true`).

## 5. First roadblocks

Ordered by when the work will hit them.

### B1. No single declaration of a switch (G6, G7)

Section 4.2: seven places per capability, three ML schema copies, defaults and vetoes in code, a hand-written doc table. The capability module is shallow: its interface (the names, the defaults, the config shape, the snapshot shape, the fail-closed value) is as large as its implementation. A switch registry (one declaration per switch: name, kind, default, scope, the load boundary it opens, the capability name it refuses with) would let `getProcessCapabilities`, the schemas, `FAIL_CLOSED_PROCESS_CAPABILITIES`, `miroir-env show` and the doc table derive from it. Prerequisite for everything else; also the cheapest.

### B2. Gating and loading are separate, joined by hand (G1, G3)

Only `ai` ties a capability to a load boundary, and it does so in two places written by hand (`RootComponent.tsx` and `mountCopilotKitRoute.ts`). `designerTools` hides but loads everything and refuses nothing at the route (section 4.1). `mcp` loads `miroir-mcp` whatever its value. Store packages load on demand in Electron and eagerly on the server: two adapters of the same seam, two patterns. For a plain runtime, the switch has to sit at the load boundary: one seam where "off" means both "not shown", "refused" and "not loaded". #273 D2 already asks for "same check for both" hiding and refusing; loading is the third leg.

### B3. Runtime and editing code are not separated (G1, G2)

The biggest roadblock, and the one with no quick fix.

- Viewing uses the editor: 11 modules render `TypedValueObjectEditor`, including the instance display of a report (`ReportSectionEntityInstance.tsx:571, 641, 665`) and report inputs (`ReportInputSection.tsx:106`). It reads its values through `useFormikContext`, so an instance page in a plain runtime loads Formik and the ML element editor stack (`components/ValueObjectEditor/`, 9189 lines of TSX).
- The meta-model deployment `miroir-app-miroir` is in the entry chunk, capped at 3.4 MB by `eagerPackageMaxBytes`; it includes MiroirTest component test instances that only the editing platform runs (`bundle-policy.json` `$comment`, analysis #497 §4.7).
- `miroir-core` is one tsup bundle with `splitting: false` (`tsup.config.js:16`): a dynamic import of its own module is inlined (`code-splitting.md`, "What does not happen automatically" 5). Core-side editing logic (model actions, ML schema tooling, transformer builder support) cannot become a lazy chunk without a subpath entry or a package split.

A plain runtime needs a display module with a small interface (read-only rendering of an instance through its `mlSchema`) and the editor behind a load boundary. How much the runtime would save is not measured: the first step is a bundle report of a home page plus a report page with designer tools off, compared with on.

### B4. One build carries every feature (G1, G4)

Capabilities are runtime values; the bundle guard measures one build with everything compiled in. A smaller artefact (not only a lighter first page) needs build profiles: a profile name per build (`runtime`, `platform`, `sandbox`) turned into `define` constants, so that Rollup removes code behind an off switch, and a `bundle-policy` per profile. The sandbox already does this for one switch (`MIROIR_IS_SANDBOX`). The design question is the relation between a build profile and a capability: a profile sets the ceiling (what the build can do), the environment and later runtime rules choose within it. Without that rule, an environment can turn on a capability whose code the build removed.

### B5. Values are frozen at start, global and boolean (G4, G5)

CD-style enablement needs what none of today's capabilities have:

| Need | Today |
|---|---|
| change without restart or rebuild | "Restart the process after you edit flags" |
| scope: per user, role, application, deployment, percentage | process-wide; only rights (`designerTools`) and application rows (`versioningMode`) vary |
| states beyond on/off (off, dark, preview, on) | booleans |
| lifetime: owner, creation date, removal date, a check that flags get deleted | none; `features.cursor` alias shows the cost of keeping old names |
| audit: who turned it on, when | none |

Two precedents exist in the code: per-user through `MiroirRight`, and per-application through SelfApplication rows. Both are model data, edited at runtime, stored in Admin. That points at a switch Entity in Admin. It hits the boot-order problem #321 settled with D2-a for environments: switches that decide what to load or which store to open must be known before Admin is open. So the switch module probably needs two levels: boot-time values from the environment (and the build profile), runtime values from Admin data, with a declared rule for which switch can live at which level.

### B6. Environment detection is scattered and mixes two questions (G1, G7)

Section 4.5: four detection sites with different tests, and `ClientEnvironment` answers both "what platform am I on" and "what product am I". The sandbox veto only works because the sandbox computes its own snapshot. Profiles (B4) will add more product shapes; they need their own axis, separate from the platform.

### B7. The test matrix runs every feature at its default (G4)

The four `test-*` environments declare no `features`, so nonreg integration runs with `ai` and `mcp` off and `designerTools` on. Capabilities in the "on" state are covered by per-issue unit tests (`273-process-capability-switches/…phase9`, `275-cursor-sdk-…`). A dark-launch rule ("merged off, CI proves off is safe") needs at least two runs: every switch off (the plain runtime) and every switch on (the platform), plus the per-switch tests. Nonreg already runs several storage profiles; switch profiles would multiply them, so the selection needs a decision.

### B8. Docs drift from code (G7)

Two drifts in `process-capabilities.md` (section 4.9). A derived doc table (B1) removes this class of error.

## 6. Decision frames (to settle before a plan)

| # | Question | Options | Goals |
|---|---|---|---|
| F1 | What is a switch? | a) extend `ProcessCapabilities` as is; b) a switch registry module in `miroir-core` (declarations in TypeScript, schemas generated from it); c) switch declarations as model data (an Entity in the Miroir meta-model) | G6, G7 |
| F2 | Where values live | a) environment only (boot); b) environment + Admin data rows (runtime, scoped); c) an external flag service behind an adapter | G4, G5 |
| F3 | Build profile vs capability | a) no build profiles, runtime only (today); b) profile = ceiling, environment chooses within; c) one build per environment | G1, G4 |
| F4 | Seam for runtime vs editor | a) lazy editor behind a display module in `miroir-standalone-app`; b) separate packages (`miroir-runtime` stub exists and is unused); c) leave as is, only lazy routes | G1, G2, G3 |
| F5 | Scope of runtime switches | user, role, application, deployment, percentage: which ones first | G5 |
| F6 | CI rule for dark launch | which switch profiles nonreg runs, and whether a new switch must default off | G4 |

`miroir-runtime` and `miroir-designer` are listed as unused stubs in `AGENTS.md`; F4 b) would give them a purpose.

## 7. Key reuse

| Piece | Location |
|---|---|
| Capability snapshot, defaults, refuse | `packages/miroir-core/src/1_core/processCapabilities.ts` |
| Snapshot transport | `packages/miroir-core/src/4_services/ProcessCapabilitiesHttp.ts`, `RestClientStub.setProcessCapabilities`, Electron IPC |
| Refuse error shape | `Action2Error` `FeatureUnavailable` + `errorContext.capability` (#273 D14) |
| Per-user grant | `isDesignerToolsVisible`, `AccessPolicy.ts:91`; Admin `MiroirRight` |
| Load-on-first-call factory | `registerStoreOnDemand`, `storesOnDemand.ts` |
| Capability-gated dynamic import (server) | `mountCopilotKitRoute.ts` (`importMiroirAi` test seam) |
| Environment resolver and `features` merge | `packages/miroir-env/src/environmentState.ts` |
| Bundle guard | `scripts/check_bundle_policy.py`, `bundle-policy.json`, `tests/0_build/homePageLoad.unit.test.ts` |
| Build-time switch precedent | `miroir-sandbox/vite.config.js` `define` |
| Deprecation warning of a switch name | `features.cursor` in `environmentState.ts:242-257` |

## Next step

Confirm the goals with A, then settle F1 to F6 (skill `grilling`), then measure B3 (bundle report with designer tools off) before writing `tdd-implementation-plan.md`.
