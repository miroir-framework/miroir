# Miroir smells

Smells that come from Miroir's own conventions: action results, themes, the model, MiroirTest, loggers and ML names. Names in the snippets are illustrations unless an entry cites them as a sanctioned form.

## action-result

A function declared to return an action result (`Action2ReturnType`, `Action2VoidReturnType`, directly or in a `Promise`) that throws, or that returns `… as any`.

**Why.** Callers branch on `status` or `instanceof Action2Error`. A throw skips that branch and lands in the nearest `catch`, often a `swallowed-error`. `return result as any` hides that the returned value does not match the declared result.

**Fix.** Return an `Action2Error` with the closest `ActionErrorType`; a stub returns `"NotImplemented"`. Make the declared and returned types meet instead of casting.

```ts
// Before
open(): Promise<Action2VoidReturnType> {
  throw new Error("Method not implemented.");
}

// After
async open(): Promise<Action2VoidReturnType> {
  return new Action2Error("NotImplemented", "ErrorModelStore.open");
}
```

**Leave it** for a throw that signals a programming error the caller cannot handle (a broken invariant), with a comment saying so.

**Lint.** Lens. When reviewing a new action handler, also check its signature: an action returns `Action2ReturnType` or `Action2VoidReturnType`, never `void` or `any`.

## theme-bypass

A color written as a literal in a component: `"#333"`, `"1px solid #e0e0e0"`, `"rgb(51, 51, 51)"`, `"white"`.

**Why.** Themes are model data (the MiroirTheme Entity of `miroir-app-miroir`) and the theme selector offers a dark theme. A literal color ignores the theme the user picked: `#333` text vanishes on the dark background, a `#f5f5f5` panel glares on it, and a status color written by hand drifts from the theme's own.

**Fix.** Read the color from the theme with `useMiroirTheme()`, or use a `Themed…` component that does.

```tsx
// Before: TransformerTypeBadgeChip (#453)
match: { color: "#2e7d32", border: "#66bb6a", /* … */ },
mismatch: { color: "#c62828", border: "#ef5350", /* … */ },

// After
const { currentTheme } = useMiroirTheme();
match: { color: currentTheme.colors.success, border: currentTheme.colors.success, /* … */ },
mismatch: { color: currentTheme.colors.error, border: currentTheme.colors.error, /* … */ },
```

Sanctioned form: the same badge reads `currentTheme.colors.textSecondary` for its third status. The dark theme copies `successLight` and `errorLight` from the light one (`#e8f5e8`, `#ffebee`): check a light variant on the dark theme before relying on it.

**Leave it** where the lens already skips it: the theme definitions and the `Themed…` components (`Themes/` folders), a fallback after a theme value (`theme.colors?.text || "#000"`), and a translucent tint (`rgba(0, 0, 0, 0.1)`), which reads on any background. Leave it also for a data palette that does not depend on the background, such as chart series.

**Lint.** Lens only.

## mocked-own-module

`vi.mock(…)` of a module of this repository (a relative path or a `miroir-*` package) in a test.

**Why.** AGENTS.md: "Favor integration tests over unit tests and avoid mocking". A test of a panel whose own children are stubbed checks the stubs: it passes when the integration breaks, and breaks when internals move.

**Fix.** Write a MiroirTest (`docs/contributing/testing.md`), or run the real code on an in-memory or filesystem store (`MIROIR_ENV=test-filesystem`, the emulated server).

```ts
// Before
vi.mock("../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.js", () => ({
  EntityInstanceGrid: () => <div data-testid="entity-instance-grid-stub" />,
}));

// After: render the real grid, or describe the panel's behaviour as a MiroirTest UI suite
// (declarative steps, run by: npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor)
```

**Leave it** for a dependency that jsdom cannot run (a canvas grid, a browser-only API), stubbed with a comment naming why, and for third-party modules. A spy that keeps the real code is not a mock: a factory that spreads `importOriginal()` and wraps exports as `vi.fn(actual.f)` (the lens skips it when every property is such a spy).

**Lint.** Lens only.

## logic-in-code

A transformer, query, composite action or runner written as TypeScript object literals (`transformerType:`, `extractorOrCombinerType:`, `actionType: "compositeActionSequence"`) in application code, or a `switch` over entity uuids or names that encodes model knowledge.

**Why.** The behaviour exists twice, or only in code: reports, MCP tools, MiroirTest and the model editors cannot see it. A model element and its TypeScript copy drift apart.

**Fix.** Make it a model element in the deployment assets (Runner for a UI action, Endpoint for side effects, TransformerDefinition for a pure function, Query to fetch data), with a MiroirTest, and call it by the uuid its package exports. Skills `miroir-edit-transformers`, `miroir-edit-composite-transformers` and `miroir-edit-queries` hold the formats.

**Detect.**

```bash
git grep -c -E "transformerType:|extractorOrCombinerType:" -- 'packages/*/src/**' ':!**/0_interfaces/**' ':!**/preprocessor-generated/**' | sort -t: -k2 -rn | head
```

Then look for a model element with the same name in the deployment assets: `git grep -l '"name": "createApplication"' -- 'packages/*/assets/**'`. A pathspec with a `*` needs the trailing `/**`: `'packages/*/src'` matches no file and returns nothing, which reads as "no smell".

**Leave it** in framework bootstrap (actions the DomainController builds to run itself) and in test fixtures.

**Lint.** None: it takes judgment.

## logger

A logger not named after its file, or two loggers in one file. `docs/contributing/code-style.md` gives the setup; one logger per file, named after the file.

**Why.** Log presets (`packages/miroir-standalone-app/config/logging/`) select loggers by exact name, `<cleanLevel>_<package>_<name>`. A name copied from another file mutes the preset entry meant for this file and floods the other one.

**Fix.** Rename the logger after its file.

```ts
// Before: FileSystemStore.ts
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbStore");
// After
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileSystemStore");
```

After a rename, search the presets for both names: `git grep -n -e _SqlDbStore -e _FileSystemStore -- packages/miroir-standalone-app/config/logging`.

**Lint.** Runner (name) and lens (two loggers). Candidate error: a `miroir/logger-name` rule.

## magic-value

A uuid literal in code.

**Why.** A reader cannot tell which model element a literal means, and one uuid can name two elements of different Entities. A re-keyed element leaves stale copies behind.

**Fix.** Import the element from its deployment package and use its `uuid`, or name the constant once and import it.

```ts
// Before
endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
// After
import { modelEndpointV1 } from "miroir-app-miroir";
endpoint: modelEndpointV1.uuid,
```

Sanctioned form: `entityEntity.uuid`, imported from `miroir-app-miroir`. Before adding a constant, search for one: `git grep -n 'export const .* = "<uuid>"' -- 'packages/*/src/**'`.

**Leave it** where the literal is the definition (bootstrap ML schemas, fixtures) and in a test asserting on a specific element.

**Lint.** Lens only.

## ml-naming

`Jzod` in the name of a meta-language construct. The rules are in `docs/reference/ml-nomenclature.md`: `Ml`, `MlSchema`, `Mls`.

**Lint.** Enforced by `npm run check:ml` (`scripts/check_ml_nomenclature.py`) in the non-regression unit tier.
