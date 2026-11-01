# Issue #649 — TDD Implementation Plan

> Testing posture: the contract is about source files (which exports carry `@public`, what the template imports, what the generator emits), so the proof is a repo-level pytest over the real files, with no build for the source cases and pack-style cases on the built declarations (skipped unless built or `MIROIR_REQUIRE_PACK=1`). No mocks: the parser runs on `index.ts`, the generated file and the sandbox sources, and its unit tests use small samples of each form it must handle (analysis §4.2). No MiroirTest: no model element changes.

**Resume note:** start at the first slice whose Status is not ✅. v2 after the adversarial plan review (10 findings applied: the generator's failure must stop the build, the insertion in a side-effect-free module with a vitest, the nonreg step builds the server library and forces the pack cases, TSDoc read on masked text, async functions and extensionless paths, case 4 moved to Slice 2, shared `ts_source.py`, a D2b case, the sandbox's import forms).

## Scope

In (analysis goals):
- **G1** An application developer sees which core exports are supported (TSDoc hover, README) and that 0.x promises no stability.
- **G2** The template (today's sandbox) is kept on the supported surface by a test.
- **G3** One generated document lists the supported exports, in sync with the marks.

Out (analysis §2): a separate public entry; other packages' public API; stability or deprecation policy, API Extractor; the subpath entries `./model-validation-fs` and `./ml-to-ts`; the store contract.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/649 (epic #621, work item "Public API of core", D11-a)
- Analysis: [`analysis.md`](./analysis.md)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md)
- Working branch: `claude/649-core-public-api`, from `claude/645-duplicate-core` at `ff3e4b073` (PR #648)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | The parser finds every export's declaration (characterization) | ✅ | `test_core_public_api.py` parser cases on samples and on the real `index.ts` |
| 2 | The 34 names are marked `@public`, nothing else is | ✅ | cases 1–3, generator list |
| 3 | README, generated list, built declarations, nonreg step | ✅ | cases 4–5, `unit-649-core-public-api` |

## Locked implementation defaults

| Decision | Default | Serves |
|---|---|---|
| D1 | 0.x, no stability promise; `@public` TSDoc marks the supported part | G1 |
| D2 | the sandbox's 22 imports, the 6 server-library names, the 14 startup-signature names: 34 names (analysis §4.3); the two existing tags on `InstanceDictionaryNum` / `InstanceDictionary` are removed | G1, G2 |
| D2b | types reached through a public name are not marked; `StorageType` and `LoggerContextElement` are exported from `index.ts`, unmarked | G1 |
| D3 | `packages/miroir-core/scripts/public-generated-types.json` lists the 9 generated names; `markPublicTypes(text, names)` in the side-effect-free `packages/miroir-core/scripts/markPublicTypes.ts` inserts `/** @public */` before `^export type <Name> =` (multiline, whole name) and throws when a name is not found; `generate-ts-types.ts` calls it before writing, and on a throw sets `process.exitCode = 1` (its `generateSchemas` catch only logs, so without it the script exits 0 and `devBuild` goes on with the stale file) | G1 |
| D4 | `scripts/core_public_api.py` (parser, declaration lookup, doc generation) and `scripts/tests/test_core_public_api.py`, sharing `scripts/ts_source.py` (`strip_comments`, moved from `test_package_manifests.py`, and `mask_comments`, which keeps offsets so TSDoc is read from the raw text at positions found in the masked text); lookup follows one level of re-export (including `import { x } … export { x }`) and fails loudly | G2, G3 |
| D5 | `packages/miroir-core/README.md` (stance, D2b rule, link); `docs/reference/core-public-api.md` written by `python scripts/core_public_api.py --write`, checked by case 5 | G1, G3 |

Deviations found while implementing go to the slice's Realization.

## Allocated keys

- Script: `scripts/core_public_api.py` (`parse_exports`, `find_declaration`, `index_declarations`, `public_declarations`, `marked_in_sources`, `render_doc`; CLI `--write`, `--check`), helper `scripts/ts_source.py`.
- Generator module: `packages/miroir-core/scripts/markPublicTypes.ts`, its test `packages/miroir-core/tests/scripts/markPublicTypes.unit.test.ts`.
- Test: `scripts/tests/test_core_public_api.py`.
- Generator list: `packages/miroir-core/scripts/public-generated-types.json`.
- Docs: `packages/miroir-core/README.md` (new), `docs/reference/core-public-api.md` (generated).
- Nonreg step: `unit-649-core-public-api`, scopes `core`, `tooling`, tier `default`, `parallel: false`, `requires: "none"`, argv `["bash", "-c", "npm run build -w miroir-server-library && MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_core_public_api.py -q"]` (modelled on `unit-643-package-manifests`; the server library is not in the session setup's build groups, and the pack cases must not skip there).

No model element, no uuid, no MiroirTest suite.

## Test execution conventions

| Purpose | Command |
|---|---|
| The guard | `python -m pytest scripts/tests/test_core_public_api.py -q` |
| With pack-style cases forced | `MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_core_public_api.py -q` (after building core and server-library) |
| Regenerate types (after the generator change) | `npm run generate-ts-types -w miroir-core` (about 7 s; output identical to the tracked file today) |
| The insertion's vitest | `npm run testByFile -w miroir-core -- markPublicTypes` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |
| All script tests | `python -m pytest scripts/tests -q` |
| Safety net | `npm run nonreg:unit` |

---

## Slice 1 — The parser finds every export's declaration (characterization)

**Status:** ✅ done

### Goal

A parser that maps every name `index.ts` exports to its declaring file and declaration, so the later cases rest on facts, not on regex luck.

### Tests (RED first)

- Samples, one per form of analysis §4.2: multi-line block with `as` alias and a comment with braces; single-line block; inline `type` modifier; `export type { … } from`; `export {` without `from` (a local); trailing `export type X = …` / `export const x = …`; a declaring module with `export interface`, `export type`, `export class`, `export abstract class`, `export function` with overloads, `export async function`, `export const`, `export declare`; a bottom `export { localName }`, also after `import { localName } from`; one level of `export { X } from "./other"`; specifiers with `.js` and without extension; an `export default`; a missing name (raises with the name and the files tried).
- TSDoc attribution (on `mask_comments` offsets): a multi-line `/** … @public */` directly before an export; `@public` in a string does not count; a tag on a class member or before a non-declaration fails `marked_in_sources` explicitly.
- Real file: every one of the 34 names resolves to a file under `src/` and the expected kind; every name exported with a `from` resolves or is listed in a short, explained allow-list (expected empty or nearly; each entry justified).

### Work

- Implement the parser in `scripts/core_public_api.py`; move the string-aware comment stripper into `scripts/ts_source.py`, imported by `test_package_manifests.py` too.

### Validation

```bash
python -m pytest scripts/tests/test_core_public_api.py -q -k parser
```

### Realization

- The characterization ran before the samples: the parser resolved 1806 of the 1807 names `index.ts` exports; the miss was `parentUuidsFromResolvedReportQuery`, imported then re-exported by `createReportQueryLoadExecutor.ts:47` (`import { x } … export { x }`), now followed. All 1807 resolve (643 functions, 595 types, 405 consts, 134 interfaces, 30 classes); no allow-list.
- The first version re-scanned files per name with a tempered regex and took minutes; declarations are now indexed once per file (`declarations_of`) and the TSDoc is found by looking back from the declaration: the whole guard runs in about 5 s.
- Only 2 `@public` tags existed (`InstanceDictionary`, `InstanceDictionaryNum`), as the analysis v2 says.

---

## Slice 2 — The 34 names are marked `@public`, nothing else is

**Status:** ✅ done

### Goal

The marks exist on the 34 declarations, survive regeneration, and the test fails when the template imports an unmarked name or a mark sits on an unexported declaration.

### Tests (RED first)

- Case 1: every name the sandbox's `src/` (`.ts`, `.tsx`) imports from `"miroir-core"` or `'miroir-core'` (inline `type` modifiers and `import type` handled) is exported by `index.ts` and its declaration carries `@public`; the parsed set equals the 22 names (a parse that drifts fails here).
- Case 2: the 6 server-library names (fixed set) carry `@public`.
- Startup set: the 14 names (fixed set, the two source files named in the test) carry `@public`.
- Case 3: every `@public` declaration in core's `src/` is exported by `index.ts` under its own name, and the set of marked names equals the 34 (so the two Redux-duplicate tags fail it until removed).
- Generated file (pytest): `public-generated-types.json` equals the 9 generated names of the fixed sets, and each carries `/** @public */` right before `^export type <Name> =` in `miroirFundamentalType.ts`.
- `markPublicTypes.unit.test.ts` (vitest): marks a sample, leaves an already-marked name alone (idempotent), does not match `export type EntityX =` for `Entity`, throws on a missing name.
- D2b: `index.ts` exports `StorageType` and `LoggerContextElement`, unmarked.
- Case 4 (pack-style, characterization once core is rebuilt): `packages/miroir-core/dist/4_services/MiroirLoggerFactory.d.ts` and `dist/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.d.ts` keep `@public` on `MiroirLoggerFactory` and `Entity`.

RED: cases 1, 2, startup set, 3, the generated-file case, D2b and the vitest fail before marking.

### Work

- `/** @public */` (with a one-line summary where the declaration has none) on the 25 hand-written declarations; remove the two tags in `EntityVersion.ts`.
- `public-generated-types.json`, `markPublicTypes.ts`, the call in `generate-ts-types.ts` post-processing (lines 313–337) with `process.exitCode = 1` on a throw; `npm run generate-ts-types -w miroir-core`, then `npm run build -w miroir-core`; commit the regenerated file.
- Export `StorageType` and `LoggerContextElement` from `index.ts`.

### Realization

- RED observed for cases 1, 2, the startup set, 3, D2b, the generated-file case and case 4 (on the built core) before the marks. Deviation: `markPublicTypes.unit.test.ts` was written with the module, so its RED was not observed; the failure path was checked end to end instead: with `Bogus` added to the list, `npm run generate-ts-types` exited 1 with "expected one \"export type Bogus =\" … found 0" and left `miroirFundamentalType.ts` unchanged (same md5).
- Regeneration added exactly the 9 tags (9 insertions, no other change).
- 20 of the 25 hand-written declarations had no TSDoc: each got a one-line summary with the tag; the 5 others got ` * @public` in their existing block.
- Refactor checkpoint: the 22 template names are re-derived by case 1 at every run (parsed set equals the fixed set); the 6 server-library names equal the import of `miroir-server-library/dist/index.d.ts` (pack variant); the 14 startup names were re-derived by the analysis review, unchanged here.

### Refactor checkpoint

- Re-derive the 14 startup names from the parameters and exported option/result types of `startMiroirPlatform`, `startMiroirNode`, `startMiroirClient` (depth 1) and the 6 from `miroir-server-library/dist/index.d.ts`; record the result in the Realization.

### Validation

```bash
npm run generate-ts-types -w miroir-core && npm run build -w miroir-core
npm run testByFile -w miroir-core -- markPublicTypes
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_core_public_api.py -q
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run lint
```

---

## Slice 3 — README, generated list, built declarations, nonreg step

**Status:** ✅ done

### Goal

The stance and the list are readable without the sources, the built declarations carry the tags, and the guard runs in nonreg.

### Tests (RED first)

- Case 5: `docs/reference/core-public-api.md` equals `render_doc()` (fails until written).
- Case 2 pack variant: every core name imported by `miroir-server-library/dist/index.d.ts` is in the 6-name set.
- README check: `packages/miroir-core/README.md` exists, states 0.x and links the list.

### Work

- `packages/miroir-core/README.md`: one paragraph on 0.x and `@public`, the D2b rule, the subpath entries as unmarked, a link to the list.
- `python scripts/core_public_api.py --write`.
- Nonreg step `unit-649-core-public-api`; `docs/reference/release-process.md` short section; epic plan row for I5 slice 3's `@public` part set to ✅ #649.

### Validation

```bash
npm run build -w miroir-core && npm run build -w miroir-server-library
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_core_public_api.py -q
python scripts/run-nonreg.py --only unit-649-core-public-api
# pre-push gate (AGENTS.md)
npm run nonreg:unit
```

### Realization

- `run-nonreg.py --tier default --only unit-649-core-public-api`: passed in 11 s.
- Pre-push gate: skills sync, `pytest scripts/tests` (517 passed, 12 skipped), dependency policy, lint, `miroir-env check --strict --tracked-clean`, core tsc, bare console check all pass.

---

## Acceptance criteria → proof

| Issue criterion | Proof |
|---|---|
| The 0.x stance is stated | README (Slice 3) |
| Supported exports are marked `@public`, generated ones included | cases 1–3, generated-file case, `markPublicTypes` vitest, case 4 (Slice 2) |
| The template only uses marked exports | case 1 |
| The list is documented | `core-public-api.md`, case 5 |

## Revision history

- v1 (2026-11-01): first version.
- v2 (2026-11-01): adversarial plan review, 10 findings applied (see resume note).
