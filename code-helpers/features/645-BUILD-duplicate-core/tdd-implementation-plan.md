# Issue #645 — TDD Implementation Plan

> Testing posture: two copies of core need two module instances of the built `dist/index.js`, which the meta-language cannot express. So the proof is a core vitest file (`testByFile`) that starts fresh Node processes on real copies, without mocks, plus in-process cases of the guard function with an injected `globalThis` stand-in, dev-tool flag and warn sink (seams, not mocks). The repo's own runs (core unit, full filesystem nonreg) prove that no host already loads two copies.

**Resume note:** start at the first slice whose Status is not ✅. v2 after the adversarial plan review (12 findings applied: no core build inside the nonreg step, a non-array record never throws, raw-facts probe, child environment and Windows URLs, scopes, docs locations).

## Scope

In (analysis goals):
- **G1** A duplicated install says so: a WARN line naming each copy's version and location.
- **G2** No false alarm in development: silent on re-evaluation from one location under Vite and vitest.
- **G3** The record is inspectable on `globalThis[Symbol.for("miroir-core.instances")]`.

Out (analysis §2): a hard error or opt-in failure mode; preventing duplicates (#643); other Miroir packages' duplicates; a CLI or MCP diagnostic command.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/645 (epic #621, plan I5 slice 1)
- Analysis: [`analysis.md`](./analysis.md)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md)
- Working branch: `claude/645-duplicate-core`, from `_integration` at `05637625b`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | The repo loads one copy of core (characterization) | ⬜ | probe over core unit and full `nonreg:filesystem` |
| 1 | A second copy of core warns, with its record on `globalThis` | ⬜ | `duplicateCoreGuard.unit.test.ts` (fresh-process and in-process cases) |
| 2 | Nonreg step, docs, AC | ⬜ | `unit-645-duplicate-core`, full filesystem nonreg |

## Locked implementation defaults

| Decision | Default | Serves |
|---|---|---|
| D1 | a top-level call at the end of `ConfigurationService.ts`, after the singleton | G1 |
| D2 | every evaluation is a copy; when `import.meta.hot` is defined or `globalThis.process?.env?.VITEST` is set, one location (`import.meta.url` without query or hash, `"unknown"` when undefined) is one copy | G1, G2 |
| D3 | the message goes to `ConfigurationService.ts`'s own logger (`log.warn`), a `PreStartLogger` at that point; no bare `console` | G1 |
| D4 | `globalThis[Symbol.for("miroir-core.instances")]`: `{ version, location }[]`; nothing new exported from `index.ts` | G3 |
| D5 | copies of `dist/index.js` in `packages/miroir-core/tests/tmp/645-a/` and `645-b/`, removed in `afterAll`; children run with `VITEST*`, `MIROIR_LOG_CONFIG*` and `VITE_MIROIR_LOG_CONFIG*` removed from their environment | G1, G2 |
| D4 contract | entries may gain fields but never change type; a value under the key that is not an array is never thrown on: the copy warns "unrecognised record" and leaves it untouched | G1, G3 |

Deviations found while implementing go to the slice's Realization.

## Allocated keys

- Source: `packages/miroir-core/src/3_controllers/duplicateCoreGuard.ts` (`registerMiroirCoreInstance`, `MIROIR_CORE_INSTANCES`, `MiroirCoreInstance`; module-internal, not re-exported by `index.ts`).
- Test: `packages/miroir-core/tests/3_controllers/duplicateCoreGuard.unit.test.ts` (feature-named from the start, no issue directory).
- Nonreg step: `unit-645-duplicate-core`, scopes `core`, `actions`, `tooling`, tier `unit`, `requires: "none"`; runs the test on the built core (nonreg needs built packages; no build inside the step, because tsup's `clean: true` would wipe `dist/` under the parallel steps).

No model element, no uuid, no MiroirTest suite.

## Test execution conventions

| Purpose | Command |
|---|---|
| Build core (the fresh-process cases read `dist/index.js`) | `npm run build -w miroir-core` |
| The guard test | `npm run testByFile -w miroir-core -- duplicateCoreGuard` |
| All core unit tests | `npm run test -w miroir-core -- ''` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |
| Bare console check | `python scripts/check_bare_console.py` |
| Full safety net | `npm run nonreg:filesystem` |

---

## Slice 0 — The repo loads one copy of core (characterization)

**Status:** ⬜ pending

### Goal

Know, before the warning ships, whether any host, test or nonreg step already evaluates core twice (the issue's last criterion).

### Work

- A temporary probe at the end of `ConfigurationService.ts` appends one JSON line per evaluation with raw facts only (pid, process arguments, working directory, `import.meta.url` with its query, the dev-tool flag) to the file named by `MIROIR_645_PROBE`. It is never committed. Browser hosts have no `process` and are not probed; the self-test and the app's dev server are checked by hand in Slice 2.
- Run the core unit tests and the full `nonreg:filesystem` with the probe on, then group the lines by pid in Python and apply D2 offline (several lines in one pid: a duplicate unless the dev-tool flag is set and the locations without query match). Each duplicate is a case: explain it, then fix it in Slice 1 or record it as an accepted miss in the analysis.
- Record the result in analysis §4.5.

### Validation

```bash
npm run build -w miroir-core
mkdir -p tmp-645
MIROIR_645_PROBE=$PWD/tmp-645/probe.jsonl npm run test -w miroir-core -- ''
MIROIR_645_PROBE=$PWD/tmp-645/probe.jsonl npm run nonreg:filesystem
# group by pid, apply D2 offline (one-off Python, not committed)
```

### Realization

---

## Slice 1 — A second copy of core warns, with its record on `globalThis`

**Status:** ⬜ pending

### Goal

An application developer whose project loads two copies of core sees, when the second one is evaluated, a WARN line naming both versions and locations. The record is on `globalThis`, and re-evaluation by Vite or vitest stays silent.

### RED

`packages/miroir-core/tests/3_controllers/duplicateCoreGuard.unit.test.ts`. Vitest is the vehicle because two module instances of the built core are not reachable through MiroirTest.

Fresh-process cases. `beforeAll` fails with "rebuild core: npm run build -w miroir-core" when `dist/index.js` lacks `miroir-core.instances` or is older than `src/3_controllers/duplicateCoreGuard.ts`, then copies it into `tests/tmp/645-a/` and `645-b/`; `afterAll` removes them. Each case calls `spawnSync(process.execPath, ["--input-type=module", "-e", script])` (an argument array, no shell) with `VITEST*`, `MIROIR_LOG_CONFIG*` and `VITE_MIROIR_LOG_CONFIG*` removed from the environment. The script imports `pathToFileURL(file).href` specifiers and prints the record behind a `RECORD:` prefix; the test parses that line and compares locations to the same hrefs. The warning is matched on "copies are loaded" (the pre-start logger prints the level in lowercase):
1. One copy: the record has one entry, at `645-a`, and stderr has no "copies are loaded".
2. Two folders: the record has two entries, `645-a` then `645-b`, with the same version as core's `package.json`, and stderr has one warning naming both locations.
3. The same file imported again with `?x`: two entries, and a warning.
4. Case 3 with `VITEST=true` set on purpose: one entry, no warning.

In-process cases of `registerMiroirCoreInstance(version, moduleUrl, devTool, target, warn)`:
5. The location drops the query and hash; an undefined URL gives `"unknown"`.
6. Under dev tooling, the same location twice records once and does not warn; a new location warns once, naming every entry.
7. Outside dev tooling, the same location twice records twice and warns.
8. A value under the key that is not an array: no throw, one "unrecognised record" warning, the value left as it was.

### GREEN

- `duplicateCoreGuard.ts`: the function above. A non-array value under the key: warn "unrecognised record" and return without touching it. Under dev tooling, a known location returns early. Otherwise the entry is pushed, and when the record has more than one entry, `warn` gets one message. The message gives the count and each `version at location`, names the split singletons, and ends with `npm ls miroir-core`.
- `ConfigurationService.ts`: import `package.json`'s version, and at the end call `registerMiroirCoreInstance(packageJson.version, import.meta.url, devTool, globalThis, (message) => log.warn(message))`. `devTool` is `Boolean((import.meta as any).hot) || Boolean(globalThis.process?.env?.VITEST)`.

### Refactor checkpoint

- `startup.ts` and the guard both read core's version from `package.json`: keep one import pattern.
- No bare `console` (`check_bare_console.py` stays at 0 violations).
- The spike's probe block is gone.

### Validation

```bash
npm run build -w miroir-core
npm run testByFile -w miroir-core -- duplicateCoreGuard
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
python scripts/check_bare_console.py
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,tooling
```

### Realization

---

## Slice 2 — Nonreg step, docs, AC

**Status:** ⬜ pending

### Goal

The guard's test runs in nonreg and the docs say what the warning means and what to do about it.

### Work

- Nonreg step `unit-645-duplicate-core`: `id`, `title`, `scopes` [`core`, `actions`, `tooling`], `tier: "unit"`, `requires: "none"`, `argv: ["bash", "-c", "npm run testByFile -w miroir-core -- duplicateCoreGuard"]`; no build (§ Allocated keys). The CI `core` job builds core before `npm run test -w miroir-core` (`pr-checks.yml:38–48`), so the test runs there too.
- Docs: a new §10b "Two copies of core" in `docs/reference/release-process.md`, after #643's §10a: the message, what it means, `npm ls miroir-core`, and the accepted misses (a copy built without the guard records nothing; only the copy evaluated second warns; Vite dev uses the location rule).
- Manual tracer for the browser: the standalone app's dev server and the self-test (`MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve`) show no "copies are loaded" in the console. The full default-tier nonreg's `build-636-server-release` step checks that ncc builds the guard (it rewrites `import.meta.hot`).
- Epic: the I5 slice 1 row of `../621-FEATURE-npm-packages/tdd-implementation-plan.md` (line 83) set to ✅ #645, with its proof cell changed to `duplicateCoreGuard.unit.test.ts`.
- Tracer narrative: `node` importing two copies prints the warning; automated equivalent, case 2.
- Cleanup: no issue directory (the test is feature-named).

### Validation

```bash
python -m pytest scripts/tests -q
npm run lint
npm run nonreg -- --only unit-645-duplicate-core
npm run nonreg:filesystem
```

### AC checklist

| Acceptance criterion (#645) | Proof |
|---|---|
| A second copy in the same realm warns, naming versions and locations | case 2 |
| One copy prints nothing | case 1 |
| Re-evaluation from one location under vitest prints nothing | cases 4, 6 |
| Same under Vite dev / HMR | reasoning (analysis D2) and the Slice 2 manual tracer; `import.meta.hot` itself is not exercised by a test |
| A record written by another core in another shape does not break loading | case 8 |
| Outside those tools, every evaluation is a copy (query-string import warns) | cases 3, 7 |
| Record readable on `globalThis` under a registered symbol | cases 1 to 4 read `globalThis[Symbol.for("miroir-core.instances")]` |
| Two real copies of the built core, each case in a fresh Node process | cases 1 to 4 |
| Repo hosts, tests and nonreg do not print it, or each case is explained | Slice 0 probe, Slice 2 full nonreg |

### Realization
