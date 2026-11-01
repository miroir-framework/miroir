# 649 — State core's 0.x API stance and mark its supported exports `@public`

> `miroir-core` exports about 1,080 runtime values plus as many types, most of them internals that other Miroir packages reach because they ship in lockstep. This analysis settles which exports an application is meant to use, how they are marked (epic D11-a: `@public` TSDoc, no stability promise in 0.x), how the marks of generated types are produced, and how a test keeps them honest, before core is published as `@miroir-framework/core` (#621).

Related issue: https://github.com/miroir-framework/miroir/issues/649
Parent issue: #621 (work item "Public API of core", decision D11-a; epic plan I5 slice 3's `@public` part, left open by #643)
Prerequisites: #643 (PR #644: `removeComments: false`, so TSDoc reaches the declarations), #639 (PR #642: the startup calls whose signatures name core types), #645 (PR #648, this branch's base)
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (D11, G5), [`../643-BUILD-manifest-hygiene/analysis.md`](../643-BUILD-manifest-hygiene/analysis.md) (D5 TSDoc), [`../639-REFACTOR-startup-calls/analysis.md`](../639-REFACTOR-startup-calls/analysis.md)
Key sources: [`packages/miroir-core/src/index.ts`](../../../packages/miroir-core/src/index.ts), [`packages/miroir-core/scripts/generate-ts-types.ts`](../../../packages/miroir-core/scripts/generate-ts-types.ts), [`packages/miroir-sandbox/src/`](../../../packages/miroir-sandbox/src/), [`packages/miroir-server-library/src/createMiroirServerApp.ts`](../../../packages/miroir-server-library/src/createMiroirServerApp.ts), [`packages/miroir-localcache-redux/src/startMiroirPlatform.ts`](../../../packages/miroir-localcache-redux/src/startMiroirPlatform.ts)

**Status:** D1 is the epic's D11-a, recommended there and confirmed by the request to proceed with the epic's items. The other decisions are technical and recorded here. The user asked to proceed without further confirmation. Revision history at the end.

**Baseline:** `claude/645-duplicate-core` at `ff3e4b073` (PR #648), all packages at `0.5.0-rc.1`.

---

## 1. Goals

- **G1 — Know what to rely on.** In order to write an application on `@miroir-framework/core` without building on internals, as an application developer, I see in my editor (TSDoc hover) and in the package's README which exports are supported, and that 0.x promises no stability for the rest.
- **G2 — The template stays on the supported surface.** In order to keep the generated project (`create-miroir-app`, built from `miroir-sandbox` in I7) working across releases, as a Miroir maintainer, I am told when the template starts importing an unmarked core export.
- **G3 — The list is readable without the sources.** In order to judge the API from npm or the repo, as an application developer, I can read the list of supported exports in one document, which matches the marks.

## 2. Non-goals

- A separate public entry (`index.public.ts`) or removing internal exports from `index.ts`: epic D11-b, rejected for now (a large audit before the first publish).
- The public API of `miroir-react`, the local cache, the stores, the server library: their own issues once their surface settles (I6 merges the local cache into react).
- Stability promises, deprecation policy, API Extractor reports: towards 1.0.
- The subpath entries `./model-validation-fs` and `./ml-to-ts` (example apps' tests import the first 24 times): they stay unmarked in 0.x, and case 3 only looks at what `index.ts` exports.
- Store authoring by third parties: the epic publishes Miroir's own five stores; the store contract (`PersistenceStore*Interface`, 61 names imported by `miroir-store-filesystem`) stays internal.

## 3. Decision record

| Decision | Choice | Goals | Status |
|---|---|---|---|
| D1 Stance | **0.x makes no stability promise; `@public` TSDoc marks the supported part (epic D11-a)** | G1 | Accepted |
| D2 What is public | **what the template imports, plus the core types named by the startup calls' signatures** (34 names, §4.3) | G1, G2 | Accepted |
| D2b Types reached through a public name | **not marked in 0.x; the two that `index.ts` does not export (`StorageType`, `LoggerContextElement`) are exported, unmarked** | G1 | Accepted |
| D3 Marks on generated types | **the generator adds `/** @public */` from a list next to it** | G1 | Accepted |
| D4 Guard | **a pytest reading `index.ts` and the TSDoc of each declaration; a pack-style case on the built declarations** | G2, G3 | Accepted |
| D5 Documents | **a new `packages/miroir-core/README.md` with the stance, and `docs/reference/core-public-api.md` generated from the marks, checked in sync** | G1, G3 | Accepted |

### D1 — Stance

Epic D11, option a. The README says it in one paragraph: 0.x, no stability promise, `@public` marks what applications are meant to use, anything else may change in any release.

### D2 — What is public

| Option | Pros | Cons |
|---|---|---|
| A. Everything other Miroir packages import from core (724 names) | no audit | marks nothing: most of it is internal plumbing between lockstep packages |
| **B. What the template imports, plus the core types in the startup calls' signatures** ★ | follows what an application actually writes (the template's code) and must name (the options and results of `startMiroirClient`, `startMiroirNode`, `createMiroirServerApp`); derivable, so testable | the template is today's sandbox, which also carries demo code |
| C. A hand-picked list by concept | can be tailored | arbitrary; nothing keeps it in step with the template |

The template's sources are `packages/miroir-sandbox/src/` until I7 turns them into `create-miroir-app`. The sandbox imports 22 names from core (§4.3). Each has a use there: test implementation (`expect`), activity tracker and event service passed to the startup call, bundled data typing, admin migration, logger setup. The signature part has two sources:
- the core types that `miroir-server-library`'s published declarations import (6 names);
- the core types named by the parameters of `startMiroirPlatform`, `startMiroirNode` and `startMiroirClient` and by their exported option and result types, depth 1: `startMiroirPlatform.ts` (`MiroirPlatform`, `MiroirEmulatedServer`, `MiroirPlatformOptions`, `MiroirNodeOptions`) and `startMiroirClient.ts` (`MiroirClientPlatform`), 14 names.

Two `@public` tags already exist in core, on `InstanceDictionaryNum` and `InstanceDictionary` (`EntityVersion.ts:32,40`, "duplicated from Redux"). Neither is in the D2 set, so the plan removes them: the marks mean D2 and nothing else.

The local cache's `dist/node.d.ts` cannot be used for the second source: it imports 54 core names for everything the `node` entry exports, not only the startup call.

### D2b — Types reached through a public name

A public name's declaration names other types: `StoreSectionStartup` takes a `ConfigurationServiceInner`, `ProcessCapabilities.availableStoreTypes` is a `StorageType[]`, `LoggerOptions.contextFilter` uses `LoggerContextElement`, and the 19 methods of `DomainControllerInterface` name about 30 action and query types.

| Option | Pros | Cons |
|---|---|---|
| A. Mark the depth-1 closure | an application can name every type it meets | about 50 more names, most of them the action and query unions that move with the ML; the resolver is needed to keep the closure exact |
| **B. Do not mark the closure in 0.x; export the two types that are not exported at all** ★ | the list stays what an application writes; nothing becomes unnameable | an application that names a closure type uses an unmarked export; API Extractor's `ae-forgotten-export` report is the 1.0 answer |

`StorageType` (`StorageConfiguration.ts:15`) and `LoggerContextElement` (`4_services/LoggerContext.ts:57`) appear in public signatures but cannot be imported today, so they are exported from `index.ts`, unmarked. The README says that types reached through a public name are usable as that name's shape, without a promise of their own.

### D3 — Marks on generated types

9 of the 34 names are types generated from ML schemas into `miroirFundamentalType.ts` (§4.4). That file has no TSDoc and is rewritten by `npm run devBuild -w miroir-core`.

| Option | Pros | Cons |
|---|---|---|
| **A. The generator adds `/** @public */` before `export type <Name> =` for each name of a JSON list next to it** ★ | the mark sits on the declaration consumers hover; survives regeneration; same post-processing place as the existing fixes (`generate-ts-types.ts`, the `modelVersion` quoting) | two sources of marks (TSDoc by hand, a list for generated types); the guard reads both through the generated file |
| B. Hand-written aliases (`/** @public */ export type Entity = generated.Entity`) exported instead | no generator change | two names for one type; hover shows the alias |
| C. Marks only in a list file, no TSDoc for any name | one source | departs from D11-a; the editor shows nothing |

The match is anchored, `^export type <Name> =` in multiline mode with the whole name, and the generator throws when a listed name is not found (each of the 9 is emitted exactly once in that form today; the Zod consts are camelCase, so they cannot match). The guard (D4) reads the generated file like any other, so a regeneration that loses the marks fails it. `miroirFundamentalType.ts` is tracked, so the PR commits the regenerated file.

### D4 — Guard

| Option | Pros | Cons |
|---|---|---|
| **A. Pytest (`scripts/tests/test_core_public_api.py`) over the sources, plus one pack-style case on `dist`** ★ | fast, no build for the source cases; repo preference for scripts (AGENTS.md); same pattern as `test_package_manifests.py` (pack cases skip unless `MIROIR_REQUIRE_PACK=1`) | parses TypeScript with regular expressions: bounded by the forms listed in §4.2, which the parser's unit tests cover |
| B. A vitest in core with the TypeScript compiler API | exact symbol resolution | a program over core takes about a minute; a Node test for a repo-level contract |

Cases:
1. Every name the sandbox imports from core is exported by `index.ts` and its declaration is `@public`.
2. The 6 server-library names (a fixed set, like the 14 below) are `@public`; a pack-style variant checks that every core name in `miroir-server-library`'s `dist/index.d.ts` is in the set (skips when not built, unless `MIROIR_REQUIRE_PACK=1`).
3. Every `@public` declaration in core's `src/` is exported by `index.ts`, under its own name.
4. The built declarations keep the tag, for one hand-written and one generated name (pack-style).
5. `docs/reference/core-public-api.md` equals what the generator script prints.

Finding a name's declaration: from `index.ts`'s `from` path, the parser looks for the declaration in that module (`export interface|type|class|function|const|abstract class|declare …`, or a local declaration exported by a bottom `export { name }`), follows one level of `export { … } from` in that module, and fails with the name and the files it tried when it finds nothing. It never passes silently.

Where it runs: in `pytest scripts/tests` (pr-checks) and as a nonreg step `unit-649-core-public-api`, next to `unit-643-package-manifests`.

The startup calls' 14 signature names (D2) are marked by hand. A case for them would need the TypeScript resolver, so they are listed in the test as a fixed set, with the two source files named, and the plan's refactor checkpoint re-derives them.

### D5 — Documents

- `packages/miroir-core/README.md` does not exist. npm shows a README on the package page and packs it whatever `files` says, so this is where the stance goes, with a link to the list.
- `docs/reference/core-public-api.md`: one table, name, kind, declaring file, one line from the TSDoc summary when there is one. Generated by `scripts/core_public_api.py --write` and checked by case 5.

## 4. Current state

### 4.1 Size of the surface

- `index.ts`: 2239 lines, 212 `export {` blocks (210 with a `from`; 2 export locals defined with `require()` in `index.ts`), 26 `export type { … } from`, 2 trailing `export type` / `export const` aliases (`EntityInstancesIndex`, `entityInstancesIndex`), no `export *`.
- The built module has 1078 runtime exports (`Object.keys(await import("dist/index.js"))`).
- TSDoc tags in core's `src/`: `@public` twice, on the exported interfaces `InstanceDictionaryNum` and `InstanceDictionary` (`EntityVersion.ts:32,40`; removed by this work, D2), `@internal` once (`schemaForDeployment.ts:32`).
- Other packages import about 720 distinct names from core in their `src/` (named imports of `from "miroir-core"`, comments stripped; the count moves by a few with the regex): react about 350, standalone app about 213, localcache-redux 132, store-postgres 118, … sandbox 22.

### 4.2 Form of `index.ts`

Names are mostly listed one per line in braces, with `as` aliases and line comments. Other forms the parser handles: single-line blocks (`:724`, `:794`), inline `type` modifiers (`:1604 type LogPhase`, `:2212`), the two `export {` blocks without `from` that export `require()` locals (`:2219-2222`, `:2228-2231`), local `import … as` lines used by the trailing aliases (`:2236-2237`). Re-exported modules add: one level of re-export (`LoggerContext.ts:3` re-exports `LogPhase`), `export default` (7 modules, e.g. `RestClientStub.ts:346`), bottom `export { localName }` (`createReportQueryLoadExecutor.ts:47`). None of the 34 names hits these today; case 3 and the doc's declaring-file column do. Some comments contain braces: a parser that does not strip comments first splits a block too early. A first count, made without stripping comments, missed `Deployment` (`index.ts:161`) and `StoreOrBundleAction` (`:442`). The guard strips comments with the string-aware stripper of `test_package_manifests.py`.

### 4.3 The 34 names (D2)

| Source | Names |
|---|---|
| sandbox (22) | `Action2Error`, `ConfigurationService`, `Deployment`, `Domain2ElementFailed`, `Entity`, `EntityInstance`, `EntityInstanceCollection`, `EntityVersion`, `LoggerFactoryInterface`, `LoggerInterface`, `MiroirActivityTracker`, `MiroirConfigClient`, `MiroirEventService`, `MiroirLoggerFactory`, `PersistenceStoreControllerManager`, `SpecificLoggerOptionsMap`, `StoreOrBundleAction`, `StoreUnitConfiguration`, `defaultMetaModelEnvironment`, `defaultSelfApplicationDeploymentMap`, `expect`, `versionHistoryEntityUuids` |
| `miroir-server-library` declarations (6; 4 not above) | `ApplicationDeploymentMap`, `AuthenticationGate`, `DomainControllerInterface`, `MiroirConfigServer`, `PersistenceStoreControllerManagerInterface`, `ProcessCapabilities` |
| startup call signatures (14; 8 not above) | `ExternalServiceClientInterface`, `LoggerOptions`, `MiroirContext`, `RestClientInterface`, `RestClientStub`, `StoreSectionStartup`, plus `DomainControllerInterface`, `MiroirActivityTracker`, `MiroirConfigClient`, `MiroirConfigServer`, `MiroirEventService`, `PersistenceStoreControllerManager`, `ProcessCapabilities`, `LoggerFactoryInterface` |

Union: 34 names, all exported by `index.ts` under their own name.

### 4.4 Where they are declared

| Kind | Names | Files |
|---|---|---|
| generated (D3) | `Deployment`, `Entity`, `EntityInstance`, `EntityInstanceCollection`, `EntityVersion`, `MiroirConfigClient`, `MiroirConfigServer`, `StoreOrBundleAction`, `StoreUnitConfiguration` (9) | `0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` |
| hand-written (25) | the others | `DomainElement.ts`, `DomainControllerInterface.ts`, `LoggerInterface.ts`, `ExternalServiceClientInterface.ts`, `PersistenceInterface.ts`, `PersistenceStoreControllerManagerInterface.ts`, `Deployment.ts`, `Model.ts`, `processCapabilities.ts`, `AccessGate.ts`, `test-expect.ts`, `ConfigurationService.ts`, `MiroirActivityTracker.ts`, `MiroirContext.ts`, `MiroirEventService.ts`, `MiroirLoggerFactory.ts`, `PersistenceStoreControllerManager.ts`, `RestClientStub.ts` |

`generate-ts-types.ts` already post-processes the generated text before writing it (lines 313–337: the #217 alias block, the `modelVersion` quoting).

### 4.5 Declarations and README

Core's declarations are emitted per file by `tsc -p tsconfig.declarations.json` into `dist/`. Since #643, `removeComments` is `false` (root `tsconfig.json:31`, inherited by core), so TSDoc reaches them; a sample with `/** @public */` before `export type` keeps the tag in its emitted declaration (`test_published_declarations_carry_tsdoc`). Core has no `README.md`. Its `files` lists `LICENSE.md`, `package.json`, `dist/index.js` and its map, `dist/**/*.d.ts`, and the two subpath bundles with their maps; npm packs a README whatever `files` says.

## 5. Key reuse

| Piece | Location |
|---|---|
| String-aware comment stripper, pack-style skip, `MIROIR_REQUIRE_PACK` | `scripts/tests/test_package_manifests.py` |
| Generator post-processing | `packages/miroir-core/scripts/generate-ts-types.ts:313–337` |
| Published-declarations TSDoc case | `test_published_declarations_carry_tsdoc` (`test_package_manifests.py`) |
| Nonreg step format | `scripts/nonreg-manifest.json`, `unit-643-package-manifests` |

## 6. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| A regeneration without the post-processing | generated types lose `@public` | case 1 fails on `Entity` and the others |
| The regex parser misreads a declaration | a false pass or failure | cases run on the real files; the parser is unit-tested on samples with comments, aliases, `declare`, `abstract`, overloads |
| An application names a type reached through a public name (D2b) | it relies on an unmarked export | the README states the rule; 1.0 adds API Extractor's `ae-forgotten-export` |
| The parser cannot find a declaration (a new export form) | the guard fails | it fails loudly with the name and files tried, never passes |
| Marking an internal type public because the sandbox happens to use it | a wider promise than meant | 0.x promises nothing (D1); the list is reviewed in the PR, and I7 trims the template |

## Revision history

- v1 (2026-11-01): first version.
- v2 (2026-11-01): adversarial review, 11 findings applied: D2b for types reached through public names (export `StorageType`, `LoggerContextElement`); the existing `@public` tags are on two exported interfaces and are removed; the parser's forms and declaration lookup (one level of re-export, fails loudly); subpath entries as a non-goal; `files` corrected; startup names' source worded; anchored generator match that throws; case 2 on a fixed set; counts approximate; nonreg step named.
