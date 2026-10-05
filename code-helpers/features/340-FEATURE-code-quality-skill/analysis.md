# 340: Code smells and their remedies (code-quality skill)

> Steps 1 and 2 of #340: the code smells of the Miroir codebase, with how to detect each one, examples from the repository, why it hurts, its remedy, and whether a lint rule can enforce it. Step 3 is the skill [`miroir-code-quality`](../../../.agents/skills/miroir-code-quality/SKILL.md); its trial on PR #457 is in [`trial-pr-457.md`](trial-pr-457.md).

Related issue: https://github.com/miroir-framework/miroir/issues/340 (requested in the #330 project thread)
Related analyses: [`311` architecture review](../311-REFACTOR-architecture-review/analysis.md) (several of its "Found on the way" bugs are smell examples here), [`325` minimal linter rules](../325-BUILD-minimal-linter-rules/analysis.md) (errors only, bulk suppressions), [`339` external service environment](../339-REFACTOR-external-service-environment/analysis.md) (the module-state remedy, applied)
Key sources: [`eslint-rules/smell-lens.config.mjs`](../../../eslint-rules/smell-lens.config.mjs), [`scripts/code_smells.py`](../../../scripts/code_smells.py), [`eslint.config.mjs`](../../../eslint.config.mjs), [`eslint-suppressions.json`](../../../eslint-suppressions.json)

**Status:** decisions taken by the agent with recommended defaults on 2026-10-04. A's answers on PR #476 (2026-10-05): keep the two smells of D9, file [section 6](#6-found-on-the-way) as one checklist issue (#481), and graduate the candidates of [section 5](#5-remedies-and-lint-verdicts) in this PR (D7). The skill's two tools (the lens and the runner) were written test first, one green commit each; the trial on PR #457 changed them and added two smells (D9). The graduation follows [`tdd-implementation-plan.md`](tdd-implementation-plan.md).

---

## 1. Goals

- **G1. Review a change.** In order to stop silent failures before they merge, as a reviewer (human or agent), I can list the smells a branch adds, ordered by impact, each with its remedy.
- **G2. Refactor an area.** In order to know what "better" means in this codebase, as a contributor refactoring code, I can look up a smell's Miroir remedy with a before and after, and a sanctioned form in the repository to copy.
- **G3. Write new code.** In order to follow the conventions on the first try, as an agent about to write code, I can check a short list of the smells that matter here, most harmful first.
- **G4. Tighten lint.** In order to turn a recurring smell into a blocking check without a big-bang cleanup, as a maintainer, I can see for each smell whether a lint rule can enforce it and how many existing violations it would count.

## 2. Non-goals

- Fixing the smells. [Section 6](#6-found-on-the-way) lists the fixes worth an issue each. This PR only corrects the two documentation lines the skill cites (D8).
- Module depth and seams (skills `codebase-design`, `improve-codebase-architecture`; #311 did that review), and the quality of the history (skill `miroir-assess-evolution-quality`).
- A blocking lens: `npm run lint` stays errors only (#325 D2).
- Type-aware rules (#325 D5) and formatting.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1. Invocation | **Model-invoked**, with three branches: review a change, refactor an area, write new code | G1, G2, G3 |
| D2. Detection | **A warn-level ESLint "smell lens" plus a Python runner**, `npm run smells` | G1, G4 |
| D3. Review scope | **`--diff`: the findings on constructs the branch changes**, unless the base already had them; paths: whole files | G1, G2 |
| D4. Vocabulary | **One kebab-case smell id per smell**, shared by the lens messages, the runner's sections and the skill | G1, G2, G3 |
| D5. Order | **Wrong behaviour, then cost of change, then readability** | G1, G3 |
| D6. Where things live | **Examples, counts and lint verdicts here; patterns, remedies with before and after, and sanctioned forms in the skill** | G2 |
| D7. Graduation | **A lens detector becomes an error in `eslint.config.mjs`** when nearly all its findings are true and its existing violations are fixed or counted in `eslint-suppressions.json` | G4 |
| D8. Fixes in this PR | **None, except AGENTS.md's action-type line and code-style.md's logger snippet**, which the skill cites | G3 |
| D9. Smells found by the trial | **Add `theme-bypass` and `prop-drilling`; leave React's render-purity rules out** | G1, G3 |

### D1. Invocation

| Option | Pros | Cons |
|---|---|---|
| **D1-a. Model-invoked** ★ | The agent reaches it before writing code (G3) without being asked | One description line in every context |
| D1-b. User-invoked (`/miroir-code-quality`) | No context load | Nobody types it before writing new code, so G3 is lost |

### D2. Detection

| Option | Pros | Cons |
|---|---|---|
| **D2-a. Warn-level lens on top of `eslint.config.mjs`, run by a Python runner** ★ | AST precision: catch bodies, hook arguments, parameter types. Reuses ESLint 10 and typescript-eslint already in the repo. Each detector has a test. `--diff` keeps a review to what the branch changes | A second config to keep in step (it imports the first) |
| D2-b. grep commands in the skill | Nothing to maintain | grep cannot tell a catch that rethrows from one that only logs, and each run retypes the commands differently |
| D2-c. Warning rules in `eslint.config.mjs` | One config | Breaks #325 D2 (errors only); 5,600 warnings in `npm run lint` |
| D2-d. One `miroir/*` rule per smell | Full control | 25 rules to write and test, where `no-restricted-syntax` selectors cover all but three checks |

The four checks a selector cannot express are plain text checks in the runner: commented-out code (comments are not AST nodes), a logger named after another file (needs the file name), twin files across packages (needs two files), and a prop passed on as is in many files (needs every file).

### D3. Review scope

`--diff BASE` keeps the findings on code changed since the merge base with `BASE` (default `origin/_integration`), committed or not, untracked files included. A finding counts when a line is added, or cut, inside the span it reports; a twin file counts when the file has an added line. Lines that git marks as moved (`--color-moved=blocks`, re-indentation allowed) are counted, not listed: the trial's only type escape was moved code. Rejected: scanning every changed file in full, because a one-line change to `DomainController.ts` would list its 300 existing findings.

The review of PR #476 (Greptile) showed that added lines alone miss smells a change creates elsewhere in a construct: a sixth parameter on its own line (`max-params` reports the function head), a value newly read in a hook body (`exhaustive-deps` reports the dependency list), a rethrow cut from a catch. The lens now reports the parameter list and the whole hook call, and cuts count. Wider spans bring older findings into view, so a finding that the change only edits inside is listed when the base version of the file had fewer findings with its smell and message: on the #457 diff, three `useMemo` calls that already missed dependencies are counted, not listed.

### D5. Order

Wrong behaviour first: these smells pass the tests and fail in use (a swallowed error, an operator precedence trap, two swapped uuids). Then the cost of change: these work today and make the next change slower (module state, I/O in components, twins). Then readability. The counts run the other way: 2,720 `any` and 13,648 commented-out lines, against 2 precedence traps that are both bugs. Ordering by count would put the harmless first.

### D7. Graduation

A lens detector graduates when (a) almost every finding is a true positive and (b) its existing violations are fixed in the same PR or counted per file in `eslint-suppressions.json` (#325 D4), so counts only go down. [Section 5](#5-remedies-and-lint-verdicts) marks the candidates.

A chose to graduate the candidates in this PR rather than in a follow-up. Each graduated detector runs under its own rule id, `miroir/<smell-id>`, so the suppressions file counts each smell apart and the lint message names the skill entry to read.

### D9. Smells found by the trial

The trial on PR #457 ([trial-pr-457.md](trial-pr-457.md)) found two smells the survey had no row for, and one more kind of finding.

| Option | Pros | Cons |
|---|---|---|
| **D9-a. Add `theme-bypass` (lens) and `prop-drilling` (runner); leave render purity out** ★ | Both cost something visible: a dark theme that a literal color ignores, a value that costs an edit per hop. Both detectors are precise on the trial and on a sample of the repository | Two more rows; 230 and 389 findings across the repository |
| D9-b. Also add a `render-purity` smell from the React Compiler rules (`react-hooks/refs`, `purity`, `globals`) | Stock rules, nothing to write | 47 findings, nearly all harmless under React 18: the "latest value" ref idiom (38), render timing for the performance display (6) and render counters (2). The one real defect is in section 6 |
| D9-c. Record the misses, change nothing | The catalogue stays as the issue scoped it | The next review misses the same things |

---

## 4. Current state

Measured on `_integration` at `1180c7c9` (2026-10-04) with `python scripts/code_smells.py packages`, after the trial changes (D9) and the review of PR #476: 1,281 TypeScript files under `packages/` (sources, tests and scripts), 7,168 findings in 581 files. One finding is one reported node (a line, a parameter list, a hook call), one block of commented-out code, or one file for twins. Counts in `packages/*/src` exclude `preprocessor-generated/`.

### 4.1 Already enforced

| Check | Covers | State |
|---|---|---|
| `npm run lint` (#325) | `react-hooks/rules-of-hooks`, `miroir/layers`, no `.only`, jzod imports through the ML adapter | errors; 72 rules-of-hooks violations (14 files) and 24 `miroir/layers` violations (15 files) counted in `eslint-suppressions.json` |
| `eslint.config.mjs`, rules off | `no-explicit-any`, `no-unused-vars`, `no-fallthrough` (47), `no-useless-assignment` (64), `preserve-caught-error` (5), … | off, with their counts |
| `npm run check:ml` | `Jzod` names for ML constructs ([ml-nomenclature.md](../../../docs/reference/ml-nomenclature.md)) | 0 outside the enforced rules |
| `npm run check:console` | bare `console.*` | 0 outside the allow list |

The lens includes `eslint.config.mjs` and its suppressions, so `hooks-order` and `upward-import` show only new violations: 0 today.

### 4.2 Wrong behaviour

| Smell | Count (files) | Examples | Why it hurts |
|---|---:|---|---|
| `swallowed-error` | 52 (36) | `SqlDbStore.ts:76`: `open()` logs a failed Postgres connection and returns `ACTION_OK`, while `SqlDbAdminStore.ts:40` in the same package returns `new Action2Error("FailedToCreateStore", …)`. `IndexedDb.ts:105`: `openObjectStore` logs and goes on; the check that would have thrown is commented out at 108-110 | The caller sees success; the failure shows up later as another error. #311 traced one: openStore failures never reach the status checks of the server, MCP and CLI |
| `action-result` | 87 (14) | `ErrorModelStore.ts`: 18 methods typed to return an action result `throw new Error("Method not implemented.")`, although `ActionErrorType` has `"NotImplemented"`. `DomainController.ts:3866` and `3880`: `return result as any` | Callers branch on `status` or `instanceof Action2Error`. A throw skips that branch and lands in the nearest catch, often a swallowed one |
| `precedence-trap` | 2 (1) | `TransformersForRuntime.ts:3947` and `4243`: `(transformer as any)["interpolation"] ?? "build" == step` parses as `interpolation ?? ("build" == step)`, so any interpolation value counts as true (#311) | Reads right, runs wrong; both sites are bugs |
| `positional-mixup` | 80 (45) | `ITransformerHandler` (`0_interfaces/1_core/Transformer.ts:22-38`) takes `application?: Uuid` in slot 10 and `deploymentUuid?: Uuid` in slot 12; the dispatcher (`TransformersForRuntime.ts:4052-4063`) passes 10 arguments, so `deploymentUuid` lands in `application` (#311) | `Uuid` is `string`: swapped or shifted arguments compile. This is primitive obsession made visible |
| `module-state` | 135 (77) | `LocalCacheSlice.ts:211,214` (redux): `entityAdapterMap` and `entityIdAttributeByIndex`, module-level objects filled at run time, shared by the client and server caches of an emulated server (#311). `ConfigurationService.ts:107`: `static configurationService = new …`, reached by name 73 times. `schemaForDeployment.ts:29-34`: a cache with a `clearSchemaCacheForTests()` reset. `ViewParamsUpdateQueue.ts:35, 60-73`: a lazy singleton whose `getInstance(config, domainController)` keeps its first arguments. Split: 63 `let`, 39 `Map`/`Set`, 18 mutable static fields (10 in `MiroirLoggerFactory`), 8 empty objects or arrays, 7 `…ForTests` resets | Every importer shares it; setters create call-order rules; two instances in one process collide. #339 moved `ExternalServiceClient`'s module state into an injected environment: the remedy, applied |
| `hooks-order` | 0 new | 72 suppressed in 14 files | Already an error |
| `effect-derived-state` | 15 (13) | `EntityInstanceSelectorPanel.tsx:220`: an effect replaces the selected entity when it leaves the list, after a render with the stale one; `:226` resets the instance index in an effect. `MarkdownEditorModal.tsx:96`: `setEditedContent` called inside `useMemo` | An extra render with inconsistent state, and effects that chain |
| `state-from-props` | 1 (1) | `MarkdownEditorModal.tsx:91`: `useState(props.initialContent)`, re-synced by the `useMemo` above | The copy goes stale when the prop changes |
| `timing` | 17 (12) | `TransformerEditor.tsx:618`: a 2-second debounce in an effect pushes the editor state to the context. `EntityInstanceGrid.tsx:711`: navigation deferred with `setTimeout` "to prevent blocking the UI thread". `InstanceEditorOutline.tsx:450-458`: a debounce named `throttleTimer` on mousemove. Split: 10 `setTimeout(…, 0)`, 7 timers in effects | AGENTS.md: "Debouncing is usually a sign of bad design". Time-based ordering makes behaviour depend on speed: tests need waits, fast users hit the window |
| `theme-bypass` | 230 (49) | `TransformerTypeBadgeChip` (`TransformerTypeAnnotation.tsx:233-234`, #453) writes green and red as hex, while its third status reads `currentTheme.colors.textSecondary`. `UnitTestExecutionSummary.tsx:77-84`: a `#f5f5f5` panel with `#333` text. `ComponentTestSandbox.tsx:243`: the sandbox panel is `white` in every theme | Themes are model data (the MiroirTheme Entity) and the theme selector offers a dark theme; a literal color ignores the theme the user picked |

### 4.3 Cost of change

| Smell | Count (files) | Examples | Why it hurts |
|---|---:|---|---|
| `upward-import` | 0 new | 24 suppressed in 15 files (`miroir/layers`) | Already an error |
| `global-environment` | 29 (18) | `schemaModePolicy.ts:12` reads `MIROIR_SCHEMA_MODE` in layer 1; `MiroirActivityTracker.ts:25` reads `MIROIR_TEST_VERBOSE_TRACKING` | The value cannot differ per instance or per test; tests set and restore `process.env`; the browser bundle needs a shim |
| `wiring` | 2 (2) | `PersistenceStoreControllerTools.ts:61`: `mountApplicationDeployment`, a setup helper in `4_services`, builds a manager from the `ConfigurationService.configurationService` singleton. `PersistenceStoreControllerManager.ts:204` is the manager's factory job: a false positive | Wiring spread outside the roots hides which instance a caller gets |
| `component-io` | 4 (2) | `LoginPage.tsx:49`: `fetch("/auth/login")` in the submit handler; `AiActionsProvider.tsx:459, 511, 568` | The component cannot render without a server; the request bypasses DomainController and its activity tracking |
| `pub-sub` | 3 (3) | `MiroirContextReactProvider.tsx:956`: `useMiroirEvents` subscribes in an effect and copies events into state; `useIntegTestRunCoordinator.ts:10` does the same. The sanctioned form is next door: `useYamlParserStatus.ts:67-69` and `authSession.ts:89-91` use `useSyncExternalStore` | Effect plus state copy: an extra render, and a window where the copy is stale (AGENTS.md, "React") |
| `service-read-in-render` | 1 (1) | `ErrorLogsPageDEFUNCT.tsx:110`: `useMemo(() => errorLogService.getErrorStats(), [errors])` tracks `errors`, not the service. The page is still routed (`PageDispatcher.tsx:181, 232`) | Nothing re-renders when the service changes (AGENTS.md, "React") |
| `unstable-deps` | 206 (64) | `TransformerEditor.tsx:644, 646, 647`: three `safeStringify(…)` calls in the dependency list of the debounce effect. Split: 197 `exhaustive-deps`, 9 serialisations | Serialising on every render; missing dependencies read stale values |
| `prop-drilling` | 389 (45) | `applicationDeploymentMap` is passed on as is at 48 places in 22 files, `deploymentUuid` at 34 in 16, `application` at 29 in 15. The value editors pass six per-path annotations the same way (`transformerTypeBadges`, #453, the latest), 15 or 16 places each. `useApplicationDeploymentMap()` (miroir-react) reads the map from the Miroir context and has one caller: `RootComponent.tsx:310-315` copies the map into the context in an effect, one render late | Each new value costs an edit per hop, and the components in between depend on data they do not use |
| `mocked-own-module` | 90 (37) | `ListTransformerPanel.unit.test.tsx:31-42` replaces three of the panel's own children (`EntityInstanceGrid`, `JsonObjectEditFormDialog`, `TypedValueObjectEditor`) with stubs. Spies that keep the real code (`vi.fn(actual.f)`, 5) are not counted | The test checks the panel against stubs: it passes when the integration breaks and breaks when internals move. AGENTS.md: "Favor integration tests over unit tests and avoid mocking" |
| `logic-in-code` | no detector | 668 `transformerType:` lines in 35 files of `packages/*/src` (outside `0_interfaces`), led by `Importer.tsx` (266), `Runner_CreateApplication.tsx` (163), `applicative.Library.BuildPlusRuntimeCompositeAction.ts` (99). `Runner_CreateApplication.tsx` (1,562 lines) builds in TypeScript the runner that the model now holds as Runner `createApplication` (`bcc872dc-649a-410a-81bc-a8ad65f21e1c`, miroir-app-miroir) | Two definitions of one behaviour; the TypeScript one is invisible to the model tools (reports, MCP, MiroirTest) |
| `duplicated-logic` | 8 pairs (16 files) | `localcache-redux` and `localcache-zustand`: `Model.ts` (100%), `RestPersistenceClientAndRestClient.ts` (98%), `DomainStateMemoizedSelectorsForTemplate.ts` (96%). `miroir-react` and `standalone-app` Themes: `MiroirTheme.ts`, `ThemeColorDefaults.ts` (100%), `TableTheme.ts` (99%). `cli` and `mcp` `startup/storeStartup.ts` (98%). `miroir-ai` and `standalone-app` `miroirSystemPrompt.ts` (99%) | A fix lands in one copy. The twins even share copied logger names (`LocalCacheModel` in both `Model.ts`) |
| `logger` | 48 (48) | `FileSystemStore.ts:15` names its logger `SqlDbStore`, so the `scope-persistence` preset entry `4_miroir-store-filesystem_FileSystemStore` matches no logger. `RunnersList.tsx`, `Check.tsx` and `Runners.tsx` all log as `PersistenceReduxSaga`. 8 names are shared by several files; no file has two loggers | Presets select loggers by exact name: a copied name mutes the preset or floods it |

### 4.4 Readability

| Smell | Count (files) | Examples | Why it hurts |
|---|---:|---|---|
| `type-escape` | 2,831 (316) | 2,720 `any` and 111 double casts. Most in `TransformersForRuntime.ts` (290), `SqlGenerator.ts` (241), `getMiroirFundamentalMlSchema.ts` (136), `DomainController.ts` (104). The style guide's own logger snippet starts with `console as any as LoggerInterface` | The compiler checks nothing there; the precedence traps above sit behind `(transformer as any)` |
| `magic-value` | 405 (79) | `"7947ae40-eb34-4149-887b-15a9021e714e"` appears 75 times in `packages/*/src`, and it is the uuid of two elements: Endpoint ModelEndpoint and Report CommitList (miroir-app-miroir); `modelEndpointV1.uuid` is used once. `"fe9b7d99-f216-44de-bb6e-60e1a1ebb739"` appears 69 times although `miroirFundamentalMlSchemaUuid` names it (`getMiroirFundamentalMlSchemaHelpers.ts:24`) | A reader cannot tell which element a literal means; a renamed or re-keyed element leaves stale copies |
| `ml-naming` | 0 | enforced by `npm run check:ml` | Already enforced |
| `long-parameter-list` | 199 (67) | `DomainController.handleAction` (`DomainController.ts:3167`): 6 positional parameters, 4 optional | Callers pass `undefined` placeholders; slots shift (see `positional-mixup`) |
| `boolean-flag` | 152 (43) | `makeReferencesAbsolute(mlSchema, absolutePath, force?: boolean)` (`getMiroirFundamentalMlSchemaHelpers.ts:170`), called as `makeReferencesAbsolute(value, miroirFundamentalMlSchemaUuid, true)` at 821. `ViewParamsUpdateQueue.queueUpdate(updates, forceImmediate = false)`, called with `true` in `useAdminViewParams.ts:45` | The call site reads `true`; one function does two things |
| `deep-nesting` | 39 (9) | `DomainController.ts:1959-1991`: six levels | AGENTS.md: "Early returns over deep nesting" |
| `dead-code` | 2,135 (312) | 1,259 commented-out blocks (13,648 lines in 197 files) and 876 unused variables (225 files). Most commented-out lines: `Importer.tsx` (2,003 of 2,436; nothing renders it, #311), `miroir-core/sandbox.ts` (949), `applicative.Library.BuildPlusRuntimeCompositeAction.ts` (638), `TransformersForRuntime.ts` (545), `TestTools.ts` (538), `Runner_CreateApplication.tsx` (538) | Search results and reviews wade through code that does not run; git keeps the history anyway |

---

## 5. Remedies and lint verdicts

The before and after of each remedy, and the forms to leave alone, are in the skill's reference files ([`typescript.md`](../../../.agents/skills/miroir-code-quality/typescript.md), [`react.md`](../../../.agents/skills/miroir-code-quality/react.md), [`layering.md`](../../../.agents/skills/miroir-code-quality/layering.md), [`miroir.md`](../../../.agents/skills/miroir-code-quality/miroir.md)). "Lens" means the warn-level check in `smell-lens.config.mjs`; "graduate" means a candidate error per D7, with the count that would go to `eslint-suppressions.json` or be fixed.

| Smell | Remedy | Lint verdict |
|---|---|---|
| `swallowed-error` | Return an `Action2Error`, rethrow with `{ cause }`, or write the policy in a comment where a failure must not fail the caller | Lens only: a selector cannot read the policy comment. Graduate `preserve-caught-error` (ESLint core, off, 5 violations) |
| `action-result` | Return `new Action2Error("NotImplemented")` from stubs and an `Action2Error` on failure; no `as any` on a returned result | Graduate: `no-restricted-syntax` with the lens selector, 87 counted |
| `precedence-trap` | Parenthesise: `(interpolation ?? "build") == step` | **Graduate now**: `no-mixed-operators` with the `??` and comparison group; fix the 2 sites (bugs) in the same PR |
| `positional-mixup` | One options object; for the transformer handler, `{ application, deploymentUuid }` by name | Lens only: many two-uuid helpers are fine. A branded `Uuid` per kind would let the compiler enforce it |
| `module-state` | Pass the state in, or keep it in an instance built by the composition root; tests build their own instance (#339) | Lens only (135) |
| `hooks-order` | Hooks at the top level of a component or hook | Error already |
| `effect-derived-state` | Compute during render; reset state with `key` or in the event handler that causes the change | Graduate `react-hooks/set-state-in-effect`, 14 counted |
| `state-from-props` | Controlled component, or `key` on the component so it remounts with the new prop | Lens only |
| `timing` | Drive the work from the event that makes it valid (blur, submit, an action's result); `requestAnimationFrame` to coalesce drag updates | Lens only |
| `theme-bypass` | Read the color from `useMiroirTheme()` (`currentTheme.colors.success`, `.error`, `.text` …), or use a `Themed…` component | Lens only: a chart palette is legitimate. Graduating would count 230 |
| `upward-import` | Move the implementation down a layer, or depend on an interface in `0_interfaces` | Error already |
| `global-environment` | Read the environment once in the composition root (`environments/*.json`, #321) and pass the value in | Graduate: `no-restricted-properties` on `process.env` outside roots, 29 counted |
| `wiring` | Build in `5_setup` or the runtime's startup file; inject | Lens only (1 true finding) |
| `component-io` | A DomainController action, or a client passed in through props or context | Graduate: `no-restricted-globals` `fetch` in views, 4 counted |
| `pub-sub` | `useSyncExternalStore(service.subscribe, service.getSnapshot)` inside a hook | Graduate, 3 counted |
| `service-read-in-render` | The same hook; `useMemo` only for pure computation over props and state | Lens only (1) |
| `unstable-deps` | Depend on stable values (ids, memoised objects), never on serialisations; list every dependency | `react-hooks/exhaustive-deps` as an error would count 197 (#325 left it off) |
| `prop-drilling` | Provide the value once in a context and read it with a hook; pass props that travel together as one object | Runner only (cross-file) |
| `mocked-own-module` | A MiroirTest, or a real in-memory adapter; stub only what jsdom cannot run, and say why in a comment | Lens only: a stub can be legitimate |
| `logic-in-code` | Move it into a model element (Runner, Endpoint, TransformerDefinition, Query) in the deployment assets, and call it by the uuid exported by the package | None: judgment |
| `duplicated-logic` | One module, in the lowest package both copies depend on | Runner only (cross-file) |
| `logger` | One logger per file, named after the file | **Graduate**: a `miroir/logger-name` rule (the third argument of `getLoggerName` equals the file name); the 48 renames are mechanical |
| `type-escape` | Fix the type at its source; at a boundary, validate with the Zod schema generated from the ML schema; `unknown` and narrowing | `no-explicit-any` stays off (2,720). Graduate the double cast, 111 counted |
| `magic-value` | Import the model element from its deployment package and use `.uuid` (`entityEntity.uuid`), or name the constant once | Lens only: bootstrap schemas hold legitimate literals |
| `ml-naming` | `Ml`, `MlSchema`, `Mls` names | Enforced (`check:ml`) |
| `long-parameter-list` | Options object; split by responsibility | `max-params` 5 as an error would count 199 |
| `boolean-flag` | Two functions, or a named option (`{ forceImmediate: true }`) | Lens only |
| `deep-nesting` | Early returns; extract the loop body | Graduate `max-depth` 4, 39 counted in 9 files |
| `dead-code` | Delete it; delete dead files | `no-unused-vars` stays off (876). Commented-out code: runner only |

---

## 6. Found on the way

New since #311. Each is a small fix, or an issue of its own.

| Finding | Evidence | Fix |
|---|---|---|
| A log preset entry matches no logger | `scope-persistence.json` enables `4_miroir-store-filesystem_FileSystemStore`; `FileSystemStore.ts:15` names its logger `SqlDbStore` | Rename the logger; the `miroir/logger-name` rule would keep it fixed |
| One uuid, two elements | `7947ae40-eb34-4149-887b-15a9021e714e` is Endpoint ModelEndpoint and Report CommitList (`miroir-app-miroir/index.ts:213, 229`) | Give CommitList its own uuid (a model migration), and use `modelEndpointV1.uuid` in code |
| AGENTS.md names a type nobody uses | AGENTS.md: "Actions return `ActionReturnType` (`ActionSuccess` \| `ActionError`)"; the code uses `Action2ReturnType` and `Action2VoidReturnType` (543 uses; `ActionReturnType` is only re-exported from `index.ts`) | **Fixed in this PR** (D8) |
| The style guide teaches a pattern the code left | `code-style.md` shows `let log = console as any as LoggerInterface` with `registerLoggerToStart(getLoggerName(…))`; 1 file still does that, 250 use `getPreStartLogger` | **Fixed in this PR** (D8) |
| Stub stores throw | `ErrorModelStore.ts`, `ErrorDataStore.ts`, `ErrorAdminStore.ts`: "Method not implemented." | Return `new Action2Error("NotImplemented")` |
| A 1,562-line runner nothing renders | `Runner_CreateApplication.tsx`: imported by `RunnersList.tsx` and used there only in a comment; a test imports `buildCreateApplicationStorageSchema` through its re-export | Point the test at `buildCreateApplicationStorageSchema.ts`, delete the file |
| setState inside `useMemo` | `MarkdownEditorModal.tsx:94-98` | `key` the modal on open |
| #311 bugs still open | precedence traps (`TransformersForRuntime.ts:3947, 4243`), transformer handler slot shift (`Transformer.ts:35-37`, `TransformersForRuntime.ts:4052-4063`) | One small PR each |
| Twins after the package split | Section 4.3, `duplicated-logic` | Keep one copy per pair |
| A lazy singleton keeps its first arguments | `ViewParamsUpdateQueue.getInstance(config, domainController)` (`ViewParamsUpdateQueue.ts:60-73`) ignores both after the first call; `useAdminViewParams` (#453) calls it on every save. Latent while the page has one DomainController and one ViewParams instance | One queue per DomainController, built where the controller is provided |
| The context map arrives one render late | `RootComponent.tsx:310-315` copies `applicationDeploymentMap` into the Miroir context in an effect, so the context lags the prop that 22 files pass on (inferred as a reason for the drilling, not traced) | Give the provider the map in the same render, then read it with `useApplicationDeploymentMap()` |
| The dark theme has light variants | The dark theme (`b327b9c0-…`, miroir-app-miroir) copies `successLight` and `errorLight` from the light one (`#e8f5e8`, `#ffebee`), and its `textSecondary` is `#666666` on a `#121212` background | Dark values for these colors, in the theme instance |
| A random id on every render | `FormComponents.tsx:131` builds `componentId` with `Math.random()` during render and lists it in an effect's dependencies, so the effect runs on every render (`react-hooks/purity`) | `useId()` |
