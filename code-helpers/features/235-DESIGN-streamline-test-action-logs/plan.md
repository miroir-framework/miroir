# Feature 235 — Streamline test/action logs (CLI + UI)

GitHub issue: [miroir-framework/miroir#235](https://github.com/miroir-framework/miroir/issues/235)

**Status:** Slices 0–6 done · Slice 7 not started

**Depends on / related:** #43 (logger startup race), #197 (UI integ), workflow doc `docs/guides/architecture/workflows/runQuery-emulated-server.md`

## Overview

Keep logs **human-readable** and **grep-able postmortem**. Two orientation problems dominate:

1. You cannot isolate one test leaf or one action from a concatenated dump (`*NoTestSuite*` prefix; activity IDs not on every line).
2. You cannot tell **inbound vs return** of a hop (no paired enter/exit; sequence diagrams unnumbered).

This plan implements **run/span tokens**, **enter/exit direction**, then the noise reduction already described in #235. Pilot: `domain_controller_data_crud` / `Refresh all Instances` + UI timeline.

Constraints:

- TDD
- Reuse `MiroirLoggerFactory`, `LoggerGlobalContext`, `MiroirActivityTracker`, `MiroirEventService`, JSON log configs
- No parallel logging system
- Prefix must stay greppable as **plain text** (no ANSI-only tokens)

---

## Locked decisions

| # | Decision |
|---|----------|
| 1 | **runId** — 6 Crockford-base32 chars (`0-9 A-H J-K M-N P-T V-Z`, exclude `I L O U`). Generated at **test leaf** start (or top-level action if no test). Printed on **every** MiroirLogger line. Banner: `RUN {runId} START …`. |
| 2 | **spanId** — monotonic integer `s1…sN` **within that run**. One span = one tracked execution block enter/exit pair. Same id on `>` and `<`. |
| 3 | **Do not** put `action_${Date.now()}_…` in the prefix. Keep internal `activityId`; map to runId/spanId for prefix + UI. |
| 4 | **Direction** in prefix: `>` enter, `.` interior, `<` exit. Shape: `#K7X2NQ.s12>#` / `#K7X2NQ.s12.#` / `#K7X2NQ.s12<#`. |
| 5 | **INFO contract** — each tracked hop emits **one enter line and one exit line** at INFO (status + tiny summary on exit). Payloads stay DEBUG. |
| 6 | **Grep contract** — `grep K7X2NQ` = whole leaf. `grep 'K7X2NQ.s12'` = that block’s enter, interior, exit. Nested children have their own span; reconstruct parent+children by runId between that span’s `>` and `<`. |
| 7 | **Workflow docs** number mermaid **forward and return** edges; a table maps hop → **block name**. Logs use block names, not frozen diagram numbers. |
| 8 | **Owner of context** — `MiroirActivityTracker` start/end **writes** `LoggerGlobalContext` (runId, span stack, test labels, phase). Logger prefix only **reads**. |
| 9 | **UI** uses the same tokens (`MiroirEventService` already receives logs when activity is current). Show runId + span `>`/`<` in timeline. |
| 10 | **Pilot first** — query Path A (`localCacheOrFail`) then Path B (`storage`); then rollback summarization. |

Crockford example: `K7X2NQ`. Collision space ~1e9; fine for local/CI. Case-insensitive grep: emit **uppercase** only.

---

## Current state (gaps)

| Piece | Today | Gap |
|-------|--------|-----|
| Activity id | `generateId()` → `action_${Date.now()}_${rand}` | Not in prefix; too long for grep |
| Log prefix | `#testSuite-test-assertion-composite-action#` | Often `*NoTestSuite*-*NoTest*-*-*-*` |
| Tracker ↔ logger | Duplicated `setAction`; `LoggerGlobalContext.setTest*` mostly commented | Two sources of truth |
| Enter/exit | Ad-hoc “called with” / “done” / `&&&&` banners | Unpaired; no span |
| UI attach | `MiroirLogger.filter` only if `currentActivityId` + topic match | Interior logs drop off timeline |
| Sequelize | raw `stdout` | Untagged, no runId |

---

## Prefix (target)

```
#{runId}.{spanId}{dir}# [{time}] {level} {logger}### {message}
```

Examples from Path A:

```
#K7X2NQ.s1># [22:41:27] info 3_miroir-core_DomainController### → compositeRunBoxedQueryAction name=entityBookList
#K7X2NQ.s2># [22:41:27] info 3_miroir-core_DomainController### → handleBoxedQuery strategy=localCacheOrFail mode=remote
#K7X2NQ.s2.# [22:41:27] info 4_miroir-localcache-redux_LocalCache### runBoxedExtractorOrQueryAction books
#K7X2NQ.s2<# [22:41:27] info 3_miroir-core_DomainController### ← handleBoxedQuery status=ok n=5
#K7X2NQ.s1<# [22:41:27] info 3_miroir-core_DomainController### ← compositeRunBoxedQueryAction
```

Grep:

```bash
grep K7X2NQ logs.txt                 # whole leaf
grep 'K7X2NQ.s2' logs.txt            # one hop including interior
grep 'K7X2NQ.s2>' logs.txt           # enter only
grep 'K7X2NQ.s2<' logs.txt           # exit only
```

When no span (bootstrap before first track): `#K7X2NQ.-.#` still carries runId (session may assign runId at suite start; leaf overwrites or nests — **leaf runId is the grep key**; suite-level optional later).

---

## Execution-block catalog (pilot)

Named blocks for `runBoxedQueryAction` (match workflow doc). Span ids are **runtime**, hop numbers are **documentation**.

| Doc hop (Path B) | Block name (log) | Layer |
|------------------|------------------|-------|
| 1 / 1← | `DC.compositeRunBoxedQuery` | client DC |
| 2 / 2← | `DC.handleBoxedQuery` | client or server DC |
| 3 / 3← | `saga.remote` | client PersistenceReduxSaga |
| 4 / 4← | `REST.POST /query` | RestClientStub / RestServer |
| 5 / 5← | `PSC.handleBoxedQuery` | PersistenceStoreController |
| 6 / 6← | `SqlDbQueryRunner` | storage |

Path A skips 3–6; `DC.handleBoxedQuery` → `LocalCache.runQuery` instead (`saga.localCache`).

Add hop numbers to mermaid in `runQuery-emulated-server.md` when slice 3 lands.

---

## Slices

### Slice 0 — Tokens + prefix plumbing (no hop coverage yet)

**Red:** unit tests for Crockford generator, prefix format, stack push/pop.

- Add `runId`, `spanId`, `dir` to `LoggerContextElement`.
- `generateRunId()` (6 Crockford), `nextSpanId()` on tracker per run.
- `templateLogLevelOptionsFactory` includes `{{runId}}.{{span}}{{dir}}` **before** the old test labels (keep labels; they become secondary).
- `startTest` / `trackAction` / `startTestAssertion`: set runId (leaf) or push span; `endActivity`: pop span + log `<` if we already emit enter (slice 1).
- Banner `RUN {runId} START` / `RUN {runId} END status=`.
- Map `activityId` → `{ runId, spanId }` on the activity object (optional fields, non-breaking).

**Green:** `LoggerContext` / tracker unit tests; existing tests still pass (prefix change only).

**Done when:** a fake leaf produces lines all containing the same 6-char token; nested trackAction increments span and restores parent on end.

**Done (2026-08-14):** `generateRunId` / `formatRunLogPrefix` / `formatRunBanner`; tracker `startTest` begins a run; `trackAction` / `startTestAssertion` push LIFO spans; prefix template is `{{runToken}} #legacy…#`. Tests: `packages/miroir-core/tests/4_services/runLogTokens.unit.test.ts`. Enter/exit `>`/`<` log lines are slice 1.

### Slice 1 — Paired enter/exit at DomainController + trackAction

**Red:** unit test that `trackAction` logs `>` then `<` with same span; error path still `<` with `status=error`.

- Wrap existing `trackAction` / `handleBoxedExtractorOrQueryAction` / `handleCompositeRunBoxedQueryAction` enter/exit (try/finally).
- INFO line: `→ {block} …` / `← {block} status=`.
- Interior existing `log.info` payloads: leave for slice 4 (or demote only DC dumps if cheap).

**Green:** `domain_controller_data_crud` Refresh all Instances — grep runId shows query enter/exit. (Suite/leaf labels still `*NoTestSuite*` until slice 2.)

**Done when:** Path A has visible `>`/`<` around composite query + boxed query.

**Done (2026-08-15):** `trackAction` / `trackActivity` emit `#run.sN># → {block}` then `#run.sN<# ← {block} status=` in a try/finally (error path still `<` with `status=error`). `handleBoxedExtractorOrQueryAction` and `handleCompositeRunBoxedQueryAction` wrap with `DC.handleBoxedQuery` / `DC.compositeRunBoxedQuery`. Tests: `runLogTokens.unit.test.ts`.

### Slice 2 — Context sync (tracker → logger) + #43 readiness

- `startTestSuite` / `startTest` / `startTestAssertion` write `LoggerGlobalContext` test labels.
- Block MiroirTest / integ session until `startRegisteredLoggers` resolves (#43).
- Ensure UI integ launcher uses the same tracker instance as loggers.

**Done when:** prefix shows suite + leaf; UI timeline receives interior logs for the running activity.

**Done (2026-08-15):** Tracker `setTestSuite` / `setTest` / `setTestAssertion` (and `start*` / `track*`) write `LoggerGlobalContext` labels and restore them from `currentTestPath` on end. `MiroirLoggerFactory.whenRegisteredLoggersStarted()` gates MiroirTest walks; `registerLoggerToStart` after start creates the logger immediately (#43). UI integ `createIntegActivityTracker` reuses the tracker loggers were started with. `miroir-runner-tests.integ.test.ts` awaits logger start.

### Slice 3 — Workflow doc + hop catalog

- Number sequence-diagram edges **and return edges** in `runQuery-emulated-server.md`.
- Table hop ↔ block name (above).
- Log-reading section: grep recipes.

No production code required if slice 1 names match the table.

**Done (2026-08-15):** `runQuery-emulated-server.md` §4.1 hop catalog; Path A and Path B sequence diagrams label forward **and** return edges (`1 →` / `1←`); §7 prefix + §7.1 grep recipes. Block names match slice 1 (`DC.compositeRunBoxedQuery`, `DC.handleBoxedQuery`). Hops 3–6 enter/exit remain slice 4.

### Slice 4 — INFO contract / redundancy (query paths)

- Layer roles: DC = strategy + enter/exit; saga = target (`localCache` vs `remote`); stub = `POST /query`; PSC = section + count.
- `JSON.stringify(action)` at INFO → DEBUG.
- Path B: enter/exit on saga.remote, REST, PSC, query runner.

**Done when:** #235 acceptance 3–4 (≤ 1 INFO line per hop + pair).

**Done (2026-08-15):** `trackQueryHop` + `summarizeQueryHopResult`. Catalog wraps: `saga.localCache` / `saga.remote` (query actions only), `REST.POST /query` (`queryActionHandler`), `PSC.handleBoxedQuery`, `SqlDbQueryRunner`. DC enter extra `strategy=… mode=…`. Query-path `JSON.stringify(action)` / full result dumps moved to DEBUG. Rollback remote actions are **not** wrapped as `saga.remote` (slice 5).

### Slice 5 — Rollback / bootstrap summarization + phase

- `phase` on context: `bootstrap` \| `rollback` \| `query` \| `assertion`.
- Rollback: one INFO summary per application/section (`getInstances entities=N instances=M`); per-entity DEBUG.
- Optional: Sequelize behind a logger or suppress in default integ config.

**Done when:** rollback vs query is obvious within ~30 INFO lines (#235 AC 2).

**Done (2026-08-15):** `LogPhase` on `LoggerGlobalContext` + tracker stack (`pushPhase` / `popPhase`). Prefix `{{phase}}` after the label block (`*` if unset). Boundaries: `handleActionInternal` (rollback/bootstrap), query `trackAction` (`phase=query`), `trackTestAssertion` (`assertion`). `loadConfigurationFromPersistenceStore` wraps `→ rollback` and emits one INFO summary per section; per-entity lines DEBUG. `getInstances` / LocalCache adapter churn / `handleActionInternal START` demoted. Sequelize `SqlDbStore` `logging` → `log.debug`.

### Slice 6 — UI + export

- Timeline: show `runId`, span, `>`/`<`.
- Copy-runId control.
- Export JSON for a failed leaf (`runId`, activities, attached logs) — CLI file + UI download.

**Done when:** #235 AC 5, 9.

**Done (2026-08-15):** Timeline + events page show `#runId.spanId>` / `<` (same `formatRunLogPrefix` tokens as CLI) and a copy-runId control. `MiroirEventService.exportRun(runId)` builds `{ runId, activities, events+logs }`. CLI (`runMiroirCoreTestsFromCLI` / standalone runner CLI) writes `miroir-run-{runId}-error.json` on a failed leaf (`MIROIR_RUN_EXPORT_DIR` or cwd). Events page download uses the run bundle when the selected activity has a `runId`.

### Slice 7 — Config presets + docs

- `specificLoggersConfig_orientation.json` (INFO, DC/saga/stub).
- `specificLoggersConfig_query-debug.json`.
- Document in `docs/reference/testing.md` (or `logging.md` if created).

---

## Test plan (pilot)

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql \
  --suites domain_controller_data_crud \
  --mode integ \
  --filter '{"domainController.data.crud":["Refresh all Instances"]}'
```

Checklist:

- [ ] Banner contains 6-char runId
- [ ] `grep $RUNID` isolates the leaf (no other leaves if concatenated)
- [ ] Query hop has matching `>` and `<` span
- [ ] Failed assertion still emits `<` with error
- [ ] UI timeline lists the same runId
- [ ] DEBUG config still dumps payloads

Unit:

- [ ] Crockford alphabet / length
- [ ] Span stack LIFO with nested `trackAction`
- [ ] Prefix format regex `#([0-9A-HJKMNP-TV-Z]{6})\.(s\d+|-)[>.<]#`

---

## Non-goals (this issue)

- Structured JSON log files as the primary human format
- Distributed tracing protocol (OpenTelemetry) — tokens are local grep aids; can map later
- Numbering every function in the monorepo — catalog grows with workflow docs
- Changing Sequelize globally beyond integ default

---

## Implementation notes

- **Async / emulated server:** client and server DCs share one `MiroirContext` / tracker in emulated mode — one runId for the in-process hop is correct. **realServer** later: pass `runId` (and optional parent span) in REST body so the server process prefixes the same token.
- **Concurrency:** integ is single-thread; global context is OK. If parallel tests appear, runId must be AsyncLocalStorage — call that out as a follow-up, do not block the pilot.
- **Vitest `stdout | file > title`:** keep it; runId is the identifier that survives concatenation and UI export.

---

## Slice order (why)

0 → 1 is the orientation win (grep + enter/exit) with minimal log-volume change.  
2 makes labels trustworthy.  
3 keeps docs aligned.  
4–5 cut noise.  
6–7 UI/docs.  
Do **not** start 4–5 before tokens exist — otherwise “less logs” still cannot be grepped.
