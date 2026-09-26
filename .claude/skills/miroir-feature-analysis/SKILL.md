---
name: miroir-feature-analysis
description: Produce a Miroir feature analysis document (analysis.md) for a GitHub issue, in code-helpers/features/. Use when starting work on a new issue, when asked to analyze a feature/refactor/design/build topic, or before writing a tdd-implementation-plan.md.
argument-hint: [issue-number-or-topic]
allowed-tools: Read, Grep, Glob, Bash(gh *), Bash(graphify *), Edit, Create
---

# Miroir Feature Analysis

Produce an `analysis.md` document for a Miroir issue, following the established conventions of the existing analyses in `code-helpers/features/*/analysis.md` (see #216, #220, #225, #229, #234 for reference examples).

An analysis is a **thinking artifact, not an implementation plan**: it frames the problem, records decisions and rejected alternatives, maps the current state, and inventories reusable pieces. Implementation phasing belongs in a separate `tdd-implementation-plan.md` — do not write phase-by-phase task lists in the analysis.

## Workflow

### Step 1 — Gather issue context

- The argument is a GitHub issue number or a topic. If an issue number is given, fetch it:

```bash
gh issue view <number> --repo miroir-framework/miroir
```

- Identify: issue type (FEATURE / REFACTOR / DESIGN / BUILD / DOCUMENTATION), acceptance criteria, parent issues, and prerequisite issues.
- Read the analyses of prerequisite / related issues — they are linked from the issue or found via `Glob code-helpers/features/<number>-*/analysis.md`. Reuse their vocabulary and decision frames instead of restarting from scratch.

### Step 2 — Locate or create the feature folder

Canonical location:

```
code-helpers/features/<issue-number>-<TYPE>-<kebab-case-slug>/analysis.md
```

- `<TYPE>` matches the issue kind: `FEATURE`, `REFACTOR`, `DESIGN`, `BUILD`, `DOCUMENTATION`.
- If a folder already exists for the issue (any naming variant — some older ones contain spaces or a `#` prefix), use it; do not create a duplicate.
- Large issues may need extra focused documents next to `analysis.md` (e.g. `deployment-inventory.md` in #234, `analysis-emulated-deployment-controller-gap.md` in #197). Keep `analysis.md` as the entry point and link to them.

### Step 3 — Explore the codebase

- Per `AGENTS.md`, if `graphify-out/graph.json` exists, run `graphify query "<question>"` first for codebase questions; use `graphify path "<A>" "<B>"` for relationships. Fall back to Grep/Read when graphify does not surface enough.
- Read the key implementation files end-to-end before writing the "Current state" section — cite real file paths, real function names, real UUIDs. Never invent identifiers.
- For Miroir model elements (Entities, Reports, Runners, Endpoints…), record the **uuid** alongside the name; existing analyses always do.

#### Verification protocol (mandatory)

Every factual claim in the analysis must survive these checks — the first skill-produced analysis (#240) failed several of them:

1. **Enumerate JSON assets item-by-item, programmatically.** Never eyeball a menu / report / entity JSON and estimate its contents. Use a short Python script (repo preference) to list every item and every relevant field, e.g. `print(label, section, menuItemScope)` per menu item. Field *absence* is as significant as presence — an item missing a marker field is a fact to report, not to gloss over.
2. **Quote code with its exact location.** State which function / branch / line range a snippet comes from. If the same logic appears in several places (e.g. two rendering branches), say so and name the one quoted. Do not label a quote with a more convenient location.
3. **Verify behavior claims against the actual logic — including negations.** For every claim of the form "existing code does X" or "existing code suppresses/hides/prevents Y", walk the condition for *each* relevant flag state (feature on / off, edit mode on / off) and state the truth table explicitly. New behavior must never be attributed to existing code.
4. **Cross-check numbers.** Any count stated in one section (decision record, target behaviour) must agree with the enumerated inventory in "Current state" and with any reference table. If a table lists N rows, no other section may say N+1.
5. **Verify identity, not just existence.** When two assets share a uuid or path pattern across packages (common for cloned deployment assets), confirm *which* instance each file actually is (its `name` / owning application) before calling it a "copy" of another.
6. **Check internal consistency of the design.** If the decision record requires an effect (e.g. "app items are hidden"), trace where in the target design that effect is produced. A decision that no target section implements is a contradiction — fix one side.

### Step 4 — Settle decisions with the user

- An analysis that involves design choices must present them as an explicit **decision record**, and the choices must be **confirmed with the user** before the document is finalized (see "Confirmed design decisions (with user)" in #229, "Decision record" in #234).
- For each decision: list the options in a table with pros/cons, mark the chosen one, and keep the rejected / deferred alternatives documented with rejection rationale — later issues revisit these frames (e.g. #216 reuses its own deferred Option B).
- Draft the Goals user stories (Designer form — see Step 5) and confirm each role and benefit with the user in the same pass as the decision record.
- If no design choice is needed (pure refactor / inventory), say so and skip the decision record. User stories are still drafted and confirmed.

### Step 5 — Write the document

Use [analysis-template.md](analysis-template.md) as the skeleton. Fill sections in this order of importance:

1. **Title + abstract** — `# <NNN> — <Title>` followed by a `>` blockquote of 1–3 lines stating what the analysis covers.
2. **Related links** — GitHub issue URL, parent / prerequisite issues, relative links to sibling analyses, key source files.
3. **Status / sequencing** — only when the issue sits in a chain (see #216, #220): a small table of steps with ✅ / **this** / unblocked / later markers.
4. **Decision record** — when design choices exist (see Step 4).
5. **Goals / Non-goals** — numbered. Each goal is a **user story** in Designer form: *In order to \<benefit\> as a \<role\>, I can \<capability\>.* Lead with a short **name** (the story title). Role is a real actor (report viewer, report designer, application maintainer, MCP client — not "the system"). Capability is what they can do; benefit is why it matters. Mechanism, reuse, and safety constraints belong in the decision record, not here. Non-goals explicitly name the follow-up issues that own the excluded work.
6. **Current state** — the factual baseline: what exists today, with code snippets and file paths. Mark clearly what is aligned vs misaligned with the target (see #234 "Current state after #232").
7. **Key reuse / inventory** — table of existing pieces to reuse (`| Piece | Location |`), including UUIDs for model elements (see #225).
8. **Proposals / options with impact & effort** — when several implementation routes exist (see #199, #108).

## Writing conventions

- **Tables over prose** for decisions, inventories, comparisons, and sequencing.
- **Relative markdown links** to sibling feature folders (`../220-REFACTOR-entitydefinition-tech-debt/analysis.md`) and repo files (`../../../packages/miroir-core/src/1_core/Model.ts`).
- **Status markers**: ✅ done, **this issue**, unblocked, later. For decisions: **Accepted** / **Deferred** / **Rejected**.
- **Document role line** near the top when the doc is more than a plain analysis (e.g. "analysis **and** architectural decision record" in #216).
- **Document history** paragraph when the analysis is revised after realization of other issues — keep old decision frames discoverable, never silently rewrite them.
- **Code snippets** for current-state illustration must reflect the real code; mark removed / historical code explicitly (e.g. `// Pre-199 (removed): ...`).
- **No phase lists, no task checklists for implementation** — that is the `tdd-implementation-plan.md`'s job, produced per the `miroir-analysis-to-tdd-plan` skill. The analysis ends with a pointer to it once it exists.
- Language: English, terse technical style. Avoid filler; every sentence must carry information.

## Checklist

Before presenting the analysis:

- [ ] GitHub issue fetched and linked; parent / prerequisites identified and read
- [ ] Folder follows `code-helpers/features/<NNN>-<TYPE>-<slug>/`; no duplicate folder created
- [ ] Abstract blockquote states the doc's purpose in 1–3 lines
- [ ] All cited file paths, function names, and UUIDs verified against the real codebase
- [ ] **Verification protocol (Step 3) applied**: JSON assets enumerated programmatically; code quotes attributed to their exact branch/lines; behavior claims checked per flag state; counts cross-checked across sections; shared-uuid assets identified by name; every decision-record effect traced to a target-design mechanism
- [ ] Decision record present if design choices exist, with rejected alternatives kept
- [ ] Decisions confirmed with the user before finalizing
- [ ] Goals are user stories (Designer form: role + capability + benefit), confirmed with the user; Non-goals name their owning follow-up issues
- [ ] No implementation phasing / task lists (deferred to `tdd-implementation-plan.md`)
- [ ] Relative links used for sibling analyses and source files
