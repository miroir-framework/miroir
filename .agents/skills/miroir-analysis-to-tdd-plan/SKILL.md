---
name: miroir-analysis-to-tdd-plan
description: Produce a TDD implementation plan (tdd-implementation-plan.md) for a Miroir issue from its analysis.md. Use when a feature analysis exists (per miroir-feature-analysis) and implementation must proceed in vertical TDD slices. Adapts the generic tdd skill to Miroir (MiroirTest, applicative interfaces, no mocks).
argument-hint: [issue-number]
allowed-tools: Read, Grep, Glob, Bash(gh *), Bash(graphify *), Bash(npm *), Edit, Create
---

# Miroir: Analysis → TDD Implementation Plan

Produce `code-helpers/features/<NNN>-<TYPE>-<slug>/tdd-implementation-plan.md` from the sibling `analysis.md` (produced per the `miroir-feature-analysis` skill). Reference examples in the corpus: #225 (UI + runner), #229 (service feature), #234 (schema + asset migration).

This skill **leverages the generic `tdd` skill's wisdom** (`.agents/skills/tdd/`) and **overrides it where Miroir differs**. Read both before writing the plan.

## Keep from the `tdd` skill (unchanged)

- **Red → Green → Refactor**, one behavior at a time. Never write all tests first (horizontal slicing produces crap tests).
- **Tracer bullet first**: the first slice proves the thinnest end-to-end path.
- **Good vs bad tests** (`tdd/tests.md`): tests verify behavior through public interfaces, survive internal refactors, describe WHAT not HOW. One logical assertion per test.
- **Deep modules** (`tdd/deep-modules.md`): small interface, deep implementation. Shallow pass-through modules are a smell.
- **Interface design for testability** (`tdd/interface-design.md`): accept dependencies, return results, small surface.
- **Refactor pass after green** (`tdd/refactoring.md`), never while RED.

## Miroir overrides (the `tdd` skill alone is wrong here)

### 1. No mocks — integration through real framework machinery

`AGENTS.md`: *"always favor integration tests to unit tests, avoid mocking when possible"*. This **supersedes** `tdd/mocking.md`: even at boundaries, do not mock. Miroir tests run against the **real** DomainController, local cache, and store backends via test profiles (`emulatedServer-filesystem`, `-indexedDb`, `-sql`). The `RestClientStub` used in test mode is the framework's own server simulation infrastructure, not a mock of a collaborator — using it is the integration path, not a mocking exception. Time/randomness fakes are the only tolerated boundary fakes, and even then prefer injecting them.

### 2. Interfaces are applicative first, code second

The `tdd` skill's "public interface" means TS/JS signatures only. In Miroir the primary interface surface is **applicative**: Jzod schemas and JSON model elements — Entities, EntityVersions, Reports, Queries, Menus, Endpoints, Runners, MiroirTests. Rules:

- **Favor applicative interfaces whenever the behavior can be expressed as model data.** A new Report/Query/Runner asset is interface; a new exported TS function is a last resort.
- Lock applicative contracts (JSON shapes, uuids, `menuItemScope`-style marker fields, endpoint action payload schemas) in **Slice 0** before any code changes.
- Interface changes to core schemas imply the build chain: edit assets in `miroir-test-app_deployment-miroir` → `npm run build -w miroir-test-app_deployment-miroir` → `npm run devBuild -w miroir-core` (regenerates `miroirFundamentalType.ts`). Plan this explicitly in the slice that changes a schema.
- Code-level interfaces still follow `tdd/interface-design.md`.

### 3. MiroirTest whenever possible; vitest for internals only

Choose the test vehicle per behavior (types from `miroirFundamentalType.ts`):

| Behavior under test | Vehicle | Mode |
|---|---|---|
| Transformer logic | MiroirTest `transformerTest` | unit; integration when SQL-compiled |
| Query / extractor / combiner | MiroirTest `queryTest` | unit + integration |
| Endpoint action side-effects | MiroirTest `actionTest` | integration |
| Runner-driven flows | MiroirTest `runnerTest` | integration |
| Internal TS helper not reachable via ML | MiroirTest `functionCallTest`, else vitest | unit |
| Orchestration of the above | MiroirTest `miroirTestSuite` | — |
| Framework-internal machinery (stores, codegen, React internals) | vitest (`testByFile`) | unit/integ |

Vitest is the **exception**, reserved for what cannot be expressed through the ML. Justify each vitest file in the plan with one sentence ("not reachable through MiroirTest because …").

### 4. Verticality is enforced per slice — the corpus's known weakness

Existing plans too often produced shallow slices (a module + its unit test, no observable behavior). Each slice in the plan **must**:

- deliver **one observable behavior** — something a user, an MCP client, a runner, or a downstream model element can *do* that it could not do before;
- cut through **all layers the behavior touches** in that slice (JSON asset → Jzod schema/generated type → domain/controller → view), even if each cut is thin;
- be proven by **one new test** (RED) written against the applicative or code public interface, then minimal implementation (GREEN);
- **deepen, not widen**: prefer adding behavior behind an existing interface over exporting new surface. A slice whose main output is a new exported helper with no new observable behavior is rejected at plan review.

Slice 0 is the only exception to "observable behavior": when modifying existing code, Slice 0 **characterizes current behavior** (lock contracts, fixtures, asset inventories — see #234 Slice 0, #225 Phase 0) so refactors in later slices have a safety net.

### 5. Refactoring is planned, not hoped for — the corpus's second weakness

- The analysis's **"Current state (misaligned)"** subsections are the refactor backlog: each misalignment must appear in the plan either as a slice's refactor checkpoint or as an explicit non-goal.
- Every slice ends with a **Refactor checkpoint**: duplication extraction, module deepening, dead code revealed by the slice (see `tdd/refactoring.md`).
- The final slice includes a **cleanup pass**: migrate still-valuable issue-scoped assertions into feature-named suites and delete the `issues/<NNN>-*` test directory per `docs/contributing/testing.md` (#238 rule).

## Plan structure

Use [plan-template.md](plan-template.md). Required sections, in order:

1. **Header** — `# Issue #NNN — TDD Implementation Plan`, blockquote stating the testing posture (integration-first, no mocks, which interface the tests exercise).
2. **Scope** — what's in / out; non-goals name their owning issues (carry from analysis).
3. **Related links** — issue URL, `analysis.md`, prerequisite plans, working branch.
4. **Progress summary** — `| Slice | Title | Status | Primary proof |` table, updated as slices land.
5. **Locked implementation defaults** — the analysis's decision record copied as the plan's binding defaults; deviations discovered during implementation are recorded in the slice's *Realization* (see #229).
6. **Allocated UUIDs / keys** — every new model element's uuid and every MiroirTest suite key, allocated up front.
7. **Test execution conventions** — command table (`testMiroir`, `testByFile`, `modelValidation`, schema rebuild, `tsc` per touched package).
8. **Slice 0** — characterization (when touching existing behavior).
9. **Slices 1…N** — each: Goal / **RED** (exact test file or suite + behavior assertions) / **GREEN** (minimal implementation notes) / **Refactor checkpoint** / **Validation** (commands). After completion: **Realization** subsection recording what was actually done and problems met & solved (corpus habit — invaluable for resume/handoff).
10. **Final slice** — nonreg manifest step (`scripts/nonreg-manifest.json`), docs updates, tracer-bullet narrative (manual + automated equivalent), issue-directory cleanup, and the **AC checklist** mapping each issue acceptance criterion to its proving test.

## Conventions

- Issue-scoped vitest files live in `tests/<layer>/issues/<NNN>-<slug>/`, named `<feature>.<NNN>.phaseN.unit|integ.test.ts`; MiroirTest assets live in the deployment package they test and carry the issue number in their `description` until cleanup.
- Run: `npm run testMiroir -w miroir-core -- --suites <suite> --mode unit` / `-w miroir-standalone-app --mode integration`; vitest via `RUN_TEST=<name> npm run testByFile -w <pkg> -- <name>`; deployment assets proven by `modelValidation`; full safety net `npm run nonreg`.
- Update the plan's progress table as slices complete — the plan is a living resume document (`**Resume note:**` line in the header, see #225).

## Workflow

1. Read `analysis.md` fully (decisions, key reuse, current-state misalignments, proposals). Read the issue via `gh issue view <NNN> --repo miroir-framework/miroir` for AC.
2. Verify the analysis against the codebase where slices depend on specific facts (per `miroir-feature-analysis` verification protocol).
3. Draft slices; check each against the verticality rules (§ Miroir override 4) and the test-vehicle table (§ 3).
4. **Confirm with the user**: slice order & granularity, prioritized behaviors, allocated UUIDs, any interface changes. Adjust before writing code.
5. Write the plan file; mark Slice 0/1 as the tracer path.

## Checklist

- [ ] Analysis read; decisions carried into "Locked implementation defaults" unchanged or explicitly re-flagged
- [ ] Every slice delivers one observable behavior and cuts all touched layers (no shallow module slices)
- [ ] Slice 0 characterizes current behavior when modifying existing code
- [ ] Every behavior assigned MiroirTest type or justified vitest exception
- [ ] No mocks anywhere; real DomainController/localCache/store profiles used
- [ ] Applicative interfaces (JSON/schema/uuids) locked in Slice 0; schema rebuild step planned where needed
- [ ] Each slice has RED (named test + assertions), GREEN (minimal notes), Refactor checkpoint, Validation commands
- [ ] Analysis misalignments mapped to refactor checkpoints or explicit non-goals
- [ ] Final slice: nonreg step, docs, tracer narrative, issue-directory cleanup, AC checklist
- [ ] UUIDs / suite keys allocated up front
- [ ] User confirmed slice order, priorities, and interface changes before implementation
