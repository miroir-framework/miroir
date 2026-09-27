# 325: Minimal linter rules

> Adds one ESLint configuration for every package under `packages/`, run on every PR. Every rule is an error and the codebase passes it on the day it lands. Rules with too many existing violations stay off, listed with their counts, so later issues can switch them on one at a time.

Related issue: https://github.com/miroir-framework/miroir/issues/325
Key sources: [`eslint.config.mjs`](../../../eslint.config.mjs), [`eslint-rules/miroir-layers.mjs`](../../../eslint-rules/miroir-layers.mjs), [`.github/workflows/pr-checks.yml`](../../../.github/workflows/pr-checks.yml)

**Status:** decisions confirmed with A on 2026-09-27; implemented on branch `claude/minimal-linter-rules-02t0o4`. No TDD plan: this is configuration, not behaviour (D8).

---

## Decision record

| Decision | Choice |
|---|---|
| D1. Tool | **ESLint 9, one flat config at the repo root.** It has `react-hooks` and custom rules, which the layering rule needs. |
| D2. What "minimal" means | **Errors only.** A rule is on only if the codebase passes it today or this change fixes it. No warnings. |
| D3. Files covered | **`src/` and `tests/` of every package**, without `preprocessor-generated/`, `dist/`, `release/`, `tmp/`. |
| D4. Layering | **Enforced by a repo rule**, with the logger infrastructure allowed and existing violations frozen in a per-file list. |
| D5. Type-aware rules | **Deferred.** `no-floating-promises` and friends need a tsconfig per package and are slow. |
| D6. Formatting | **None.** The old `quotes: double` rule is dropped. |
| D7. CI | **Blocking step in `pr-checks.yml`, and a line in the AGENTS.md pre-push gate.** |
| D8. Process | **This analysis, no TDD plan, one green commit per rule group.** |

### D1. Tool

| Option | Pros | Cons |
|---|---|---|
| **D1-a. ESLint 9 + typescript-eslint** ★ | `react-hooks` plugin; custom rules in plain JS; ESLint 8 was already in `node_modules` | Slower than the Rust linters (12 s for 1172 files here) |
| D1-b. Biome | Fast, formatter included | No `exhaustive-deps` equivalent with the same semantics; no custom rules for the layering |
| D1-c. oxlint | Fast | Same gap for custom rules |

ESLint 10 exists; the config uses 9 as agreed. Moving to 10 is a version bump of `eslint` and `@eslint/js`.

### D2. What "minimal" means

A warning that nobody reads is noise, so every rule is an error. The starting set is `@eslint/js` recommended plus `typescript-eslint` recommended (both non-type-aware), minus the rules still in violation. Three repo rules are added on top: `react-hooks/rules-of-hooks`, `miroir/layers`, and no `.only` in tests.

### D4. Layering

AGENTS.md: "implementation dependencies flow downwards only". The repo rule [`miroir-layers.mjs`](../../../eslint-rules/miroir-layers.mjs) resolves each relative import of a file under `packages/<pkg>/src/<N>_<layer>/` and reports it when the target is in a layer numbered above `N` in the same package. It does not report:

- imports of `0_interfaces` (interfaces may flow both ways);
- `import type`, and imports whose specifiers are all `type`;
- `4_services/MiroirLoggerFactory` and `4_services/LoggerContext`, the logger that every layer uses today.

`no-restricted-imports` with regex patterns was rejected: a regex cannot tell `0_interfaces/1_core/x.ts` importing `../2_domain/y` (interface layer, allowed) from `1_core/x.ts` importing `../2_domain/y` (not allowed). `eslint-plugin-boundaries` and `import/no-restricted-paths` were rejected because they need a TS import resolver for the `.js` suffixes, which adds more dependencies than the 70-line rule.

The grilling round (Q4) assumed 2 upward imports besides the logger. The rule finds 26 in 16 files, because the first count only covered `1_core`/`2_domain` to `3_controllers`/`4_services`. Moving that code is out of scope, so those 16 files are listed in `eslint.config.mjs` as a frozen exception list. New files cannot be added to it without a visible config change.

---

## 1. Goals

1. **Catch mistakes before review.** In order to get feedback before a reviewer reads my PR, as a contributor (human or agent), I can run `npm run lint` and CI fails on the same errors.
2. **Keep the layering.** In order to keep miroir-core's layers meaningful, as an application maintainer, I can rely on CI to reject a new upward implementation import.
3. **Tighten one rule at a time.** In order to raise the bar without a big-bang cleanup, as a maintainer, I can remove a file from an exception list, or switch on a rule listed as off, in a small PR.

## 2. Non-goals

- `no-explicit-any` (3832 violations), `no-unused-vars` (1055), `react-hooks/exhaustive-deps` (194), `no-fallthrough` (47): each needs its own cleanup.
- The React Compiler rules of `eslint-plugin-react-hooks` 7 (`refs`, `purity`, `set-state-in-effect`, ...).
- Type-aware rules (D5), formatting (D6).
- `console.*` and ML naming: already checked by `scripts/check_bare_console.py` and `scripts/check_ml_nomenclature.py` in the non-regression unit tier.

---

## 3. Current state (before this change, `_integration` at a4a17be)

- The only lint config was `packages/miroir-standalone-app/.eslintrc.cjs` (ESLint 8 format). It extended `plugin:@typescript-eslint/recommended` and used `react-refresh`; neither plugin was installed, so it could not run. No package had a `lint` script. The file is removed.
- `pr-checks.yml` ran typecheck and miroir-core unit tests only.

Violation counts with `@eslint/js` + `typescript-eslint` recommended + `react-hooks` 7 recommended, 1133 files:

| Rule | Violations | Files | Outcome |
|---|---:|---:|---|
| `@typescript-eslint/no-explicit-any` | 3832 | 454 | off |
| `@typescript-eslint/no-unused-vars` | 1055 | 290 | off |
| `react-hooks/exhaustive-deps` | 194 | 64 | not enabled |
| `react-hooks/rules-of-hooks` | 72 | 14 | on, 14 files frozen |
| `prefer-const` | 69 | 41 | fixed (61 by `--fix`, 8 by hand) |
| `no-fallthrough` | 47 | 14 | off |
| `@typescript-eslint/no-empty-object-type` | 14 | 13 | off |
| `no-case-declarations` | 8 | 2 | fixed (braces around the case) |
| `no-useless-escape` | 7 | 2 | fixed |
| `@typescript-eslint/no-unsafe-function-type` | 5 | 1 | off |
| `no-extra-boolean-cast` | 3 | 3 | fixed |
| `no-constant-binary-expression` | 3 | 3 | fixed, 2 were bugs |
| `@typescript-eslint/no-require-imports` | 3 | 1 | off for `miroir-core/src/index.ts` only |
| `@typescript-eslint/no-unused-expressions` | 2 | 2 | fixed, 1 was a bug |
| `@typescript-eslint/ban-ts-comment` | 2 | 1 | fixed (`@ts-expect-error`) |
| `no-empty`, `no-useless-catch`, `prefer-spread` | 1 each | | fixed |
| `no-var` | 1 | 1 | off for `*.d.ts` (`declare global { var }` needs it) |

### Bugs the rules found

| File | Rule | Problem | Fix |
|---|---|---|---|
| `PageDispatcher.tsx`, `auth/UserAccountMenu.tsx` | `no-constant-binary-expression` | `` `/?${...}` \|\| "/?page=home" ``: a template literal is never empty, so the fallback never applied and an empty query gave `"/?"` | Use the fallback when the query string is empty |
| `transformer_tools.substituteTranformerReferencesInMlElement.unit.test.ts` | `no-unused-expressions` | `it("...")` closed before its callback, so the test body never ran | Callback moved inside `it(`. Its expectation was stale (the fixture now has `extend: [transformer_orderBy]`) and was updated |
| `componentTestTools.tsx` | `no-unused-expressions` | `context.setDeploymentUuid` statement with no call | Removed (it did nothing) |

---

## 4. Inventory

| Piece | Location |
|---|---|
| Config | `eslint.config.mjs` |
| Layering rule and its RuleTester test | `eslint-rules/miroir-layers.mjs`, `eslint-rules/miroir-layers.test.mjs` |
| Script | `npm run lint` (root `package.json`): the rule's test, then ESLint on `packages/` |
| Dev dependencies (root) | `eslint` 9, `@eslint/js` 9, `typescript-eslint` 8, `eslint-plugin-react-hooks` 7 |

## 5. Follow-ups

Each is a small PR that removes lines from `eslint.config.mjs`:

1. Fix the 14 files frozen for `rules-of-hooks`.
2. Fix the 16 files frozen for `miroir/layers`; moving `MiroirLoggerFactory` below `1_core` would also let the allowance go.
3. `no-fallthrough`: mark each intended fallthrough with `// falls through`, fix the others.
4. Type-aware rules (`no-floating-promises`), once the base runs in CI.
