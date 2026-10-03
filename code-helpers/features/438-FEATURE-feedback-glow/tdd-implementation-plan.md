# Issue #438 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The glow is DOM machinery with no ML surface, so its tests are vitest under happy-dom, exercising
> the public `miroir-react` API (`attachFeedbackGlow`, `FeedbackGlowBoundary`) and the real
> standalone-app components (`ComponentTestSandboxProvider`, `MiroirContextReactProvider`, `AppBar`).
> Events are real DOM events dispatched with `@testing-library` (`fireEvent`, `userEvent`), the
> same calls the in-browser runner makes. No mocks; vitest fake timers are the only fake (time).
> The tracer bullet proves that a click inside the Component Test Sandbox glows and stops glowing.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/438
Related: #435 / PR #436 (sandbox header, needed by Slice 5)
Working branch: `claude/438-feedback-glow`

**Resume note:** plan written 2026-10-03, no slice started.

---

## Scope

- G1 — See what I just used: global switch, off by default, AppBar toggle (Slice 4).
- G2 — Follow a displayed test run: sandbox boundary on by default (Slice 1), header toggle (Slice 5).
- G3 — Pay nothing when off: no listener, no CSS, no re-render (Slices 1, 2), measured (Slices 0, 6).
- G4 — Match my theme: Theme tokens for colour and duration, reduced motion (Slice 3).

This plan does **not** add environment or URL sources for the switch, enable the glow under vitest component runs, change existing focus outlines, or store the switch in admin `ViewParams` (analysis §2, R2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: render-performance baseline, ui nonreg green | ⬜ | baseline table in Realization |
| 1 | Tracer: a click in the Component Test Sandbox glows, then stops | ⬜ | `feedbackGlow.438.phase1` (miroir-react) + `componentTestSandboxGlow.438.phase1` (standalone-app) |
| 2 | Nested boundaries: innermost decides, "off" attaches nothing | ⬜ | `feedbackGlow.438.phase2` |
| 3 | Theme tokens and reduced motion | ⬜ | `feedbackGlowTheme.438.phase3` + `modelValidation` |
| 4 | Global switch: AppBar toggle, persisted, off by default | ⬜ | `feedbackGlowGlobalSwitch.438.phase4` |
| 5 | Sandbox header toggle (after #436) | ⬜ | `componentTestSandboxGlow.438.phase5` |
| 6 | Cost measurement, nonreg step, docs, cleanup, AC | ⬜ | nonreg step `unit-438-feedback-glow` + perf table |

---

## Locked implementation defaults

From [analysis §3](./analysis.md#3-decision-record). Deviations go in the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1 Mechanism | `attachFeedbackGlow(element, options) => detach`: sets `data-miroir-feedback-glow="on"`, capture-phase listeners on the element, adds class `miroir-feedback-glow` to the target control. No React state, no per-component code | G1, G2, G3 |
| D2 Targets | `closest("button, input, select, textarea, [role=button], [role=option], [role=checkbox], [role=tab], [role=menuitem], [tabindex]:not([tabindex='-1'])")`; skipped under `[data-miroir-no-glow]` | G1, G2 |
| D3 Triggers | `focusin`, `click`, `change`, `keydown` Enter/Space on non-text targets; a glowing control is not restarted | G1, G2 |
| D4 Synthetic events | `isTrusted` ignored | G2 |
| D5 Look | Theme `components.feedbackGlow { color?, durationMs? }`, defaults `#ffd54f` / `400`, written as CSS custom properties on the boundary element; `box-shadow` keyframes | G4 |
| D6 Reduced motion | `@media (prefers-reduced-motion: reduce)`: static `box-shadow`, same duration | G1 |
| D7 Location | Mechanism in `miroir-react`; Theme schema in `miroir-app-miroir`; wiring in `miroir-standalone-app` | G1, G2 |
| D8 Configuration | `FeedbackGlowBoundary enabled: boolean \| "inherit"`, optional `target="document"`; a handler acts only when the target's nearest `[data-miroir-feedback-glow]` is its own element | G1, G3 |
| D9 Sandbox | Panel wrapped in a boundary, on by default; header checkbox after #436 | G2 |
| D10 Vitest | No boundary in vitest component runs; `initialFeedbackGlowEnabled` prop for tests | G3 |
| D11 Cost proof | `ui.mlElementEditor.renderPerformance` before/after | G3 |
| R1 Glow end | `setTimeout(durationMs)` removes the class (not `animationend`) | G1, G3 |
| R2 Switch storage | `feedbackGlowEnabled` in `MiroirReactContext`, `localStorage` key `miroirFeedbackGlow` | G1 |
| Effects | Attach / detach through a callback ref (React calls the old ref with `null` when `enabled` changes), so no `useEffect` is added (AGENTS.md React rule) | G3 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Theme `mlSchema` attribute | `definition.components.feedbackGlow` (optional object: `color` string, `durationMs` number) |
| DOM attribute / class | `data-miroir-feedback-glow` (`on` / `off`), `miroir-feedback-glow`, opt-out `data-miroir-no-glow` |
| CSS custom properties | `--miroir-feedback-glow-color`, `--miroir-feedback-glow-duration` |
| Stylesheet element | `<style data-miroir-feedback-glow-styles>` in `document.head`, once per `Document` |
| localStorage key | `miroirFeedbackGlow` |
| Context fields | `feedbackGlowEnabled`, `setFeedbackGlowEnabled`; provider prop `initialFeedbackGlowEnabled` |
| Nonreg step | `unit-438-feedback-glow` (scopes `ui`) |
| MiroirTest | none: no ML surface (vitest justified in analysis D10) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Mechanism (miroir-react) | `npm run testByFile -w miroir-react -- feedbackGlow.438` |
| Standalone-app wiring | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- <name>` |
| Render performance | `MIROIR_COMPONENT_PERF=1 npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlEditorRenderPerformance"` |
| Theme deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Package builds | `npm run build -w miroir-react` (before standalone-app tests use the new exports) |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json` (and `miroir-standalone-app`, `miroir-core` when touched) |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,ui` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

Test files: `packages/miroir-react/tests/issues/438-feedback-glow/*.438.phaseN.unit.test.ts(x)` with `// @vitest-environment happy-dom`; `packages/miroir-standalone-app/tests/4_view/issues/438-feedback-glow/*.438.phaseN.unit.test.tsx`.

---

## Slice 0 — Characterize the render-performance baseline

**Status:** ⬜ pending

### Goal

Record the numbers that G3 is measured against, and confirm the `ui` scope is green before any change.

### 0.1 Baseline

No new test. Run the on-demand perf suite on the branch head (identical to `_integration`) three times and keep the median per case.

### Validation

```bash
MIROIR_COMPONENT_PERF=1 npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlEditorRenderPerformance"
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

_(pending: baseline table, per case median render time)_

---

## Slice 1 — Tracer: a click in the Component Test Sandbox glows, then stops

**Status:** ⬜ pending

### Goal

During a displayed test run, the control each step clicks, focuses or commits glows for 400 ms. Colour and duration are hard-coded defaults in this slice (Slice 3 moves them to the Theme).

### 1.1 RED → GREEN — mechanism (helper cycles grouped)

**Test:** `packages/miroir-react/tests/issues/438-feedback-glow/feedbackGlow.438.phase1.unit.test.ts` (vitest + happy-dom: DOM machinery, no ML surface)

One cycle per behavior, each against `attachFeedbackGlow(element)`:
- `fireEvent.click` on a `button` inside the element adds `miroir-feedback-glow`; after `vi.advanceTimersByTime(400)` it is gone.
- `focusin` on an `input`, `change` on a `select`, `keydown` Enter on a `[role=button]` each add the class.
- `keydown` of a letter or Space in a text `input` adds nothing.
- A click on a `span` inside a `button` glows the `button` (`closest`).
- An element under `[data-miroir-no-glow]` does not glow.
- A second event on a glowing control does not restart it: the class goes away 400 ms after the first event.
- `detach()` removes the attribute and the listeners: a later click adds nothing.
- The stylesheet `<style data-miroir-feedback-glow-styles>` appears in `document.head` on first attach, once, even after two attaches.

### 1.2 RED → GREEN — sandbox default on

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/438-feedback-glow/componentTestSandboxGlow.438.phase1.unit.test.tsx`

- Render `ComponentTestSandboxProvider`; the panel element (`data-testid="component-test-sandbox-panel"`) has `data-miroir-feedback-glow="on"`.
- A button appended to the `component-test-sandbox` element (as the runner does with a case container, in another React root) glows on `fireEvent.click`.

### GREEN

- `packages/miroir-react/src/components/FeedbackGlow/feedbackGlow.ts`: `attachFeedbackGlow`, `injectFeedbackGlowStyles(document)` (`WeakSet<Document>`), one capture-phase listener per event type, a `WeakMap<Element, timer>` for no-restart.
- `FeedbackGlowBoundary.tsx`: renders a `div` with a callback ref that attaches on element and detaches on `null`; exported from `miroir-react/src/index.ts`.
- `ComponentTestSandbox` wraps its panel content in `FeedbackGlowBoundary enabled`.
- Add `happy-dom` 20.14.5 to `miroir-react` devDependencies (same version as `miroir-standalone-app`).

### Refactor checkpoint

Keep the selector, class and attribute names as exported constants used by the tests. Check `check_dependency_policy.py` accepts the new devDependency.

### Validation

```bash
npm run testByFile -w miroir-react -- feedbackGlow.438.phase1
npm run build -w miroir-react
RUN_TEST=componentTestSandboxGlow.438.phase1 npm run testByFile -w miroir-standalone-app -- componentTestSandboxGlow.438.phase1
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
python scripts/check_dependency_policy.py
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

Manual: run a component suite from the Miroir Tests page; each step's control glows.

### Realization

_(pending)_

---

## Slice 2 — Nested boundaries: innermost decides, "off" attaches nothing

**Status:** ⬜ pending

### Goal

A scope can turn the glow on inside an app where it is off, or off inside an app where it is on. With no enabled boundary, nothing is attached (AC1, AC3).

### 2.1 RED → GREEN

**Test:** `packages/miroir-react/tests/issues/438-feedback-glow/feedbackGlow.438.phase2.unit.test.tsx` (React render of `FeedbackGlowBoundary`, happy-dom)

- `enabled={false}` inside `enabled={true}`: a click in the inner boundary adds no class; a click in the outer part does.
- `enabled={true}` inside `enabled={false}`: the reverse.
- `enabled="inherit"` renders no attribute; the enclosing boundary decides.
- With only `enabled={false}` boundaries: no `<style data-miroir-feedback-glow-styles>` in the document, and a click adds no class anywhere.
- Re-rendering with `enabled` switched from `true` to `false` detaches (callback ref called with `null`): the attribute becomes `off`, a click adds nothing.

### GREEN

Handler guard: act only when `target.closest("[data-miroir-feedback-glow]") === boundaryElement`. `FeedbackGlowBoundary` builds its callback ref with `useCallback` on `[enabled]`, so a change re-runs detach / attach.

### Refactor checkpoint

The guard and the target resolution belong to `attachFeedbackGlow`, not to the React wrapper.

### Validation

```bash
npm run testByFile -w miroir-react -- feedbackGlow.438
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
```

### Realization

_(pending)_

---

## Slice 3 — Theme tokens and reduced motion

**Status:** ⬜ pending

### Goal

A theme designer sets the glow colour and duration in the Theme; users who ask for reduced motion get a static glow (AC4, AC5).

### 3.1 RED → GREEN

**Test:** `packages/miroir-react/tests/issues/438-feedback-glow/feedbackGlowTheme.438.phase3.unit.test.tsx`

- `resolveThemeColors` on the real `defaultMiroirTheme` instance gives `components.feedbackGlow` `{ color: "#ffd54f", durationMs: 400 }`; on a theme setting `{ color: "#ff9800", durationMs: 800 }` it keeps them.
- `FeedbackGlowBoundary` under `MiroirThemeProvider` with that theme writes `--miroir-feedback-glow-color: #ff9800` and `--miroir-feedback-glow-duration: 800ms` on its element, and the class goes away after 800 ms.
- The injected stylesheet has an `@media (prefers-reduced-motion: reduce)` rule for `.miroir-feedback-glow` without `animation` (read from the CSSOM).

### GREEN

- Theme Entity `mlSchema` (`miroir-app-miroir/assets/miroir_model/16dbfe28-…/bdcf956a-771d-40a1-a878-06e0bf6efd3e.json`): optional `components.feedbackGlow`. Rebuild app-miroir, `devBuild` miroir-core.
- `resolveThemeColors`: defaults for `feedbackGlow`.
- `FeedbackGlowBoundary` reads `useMiroirTheme().currentTheme.components.feedbackGlow` and passes it to `attachFeedbackGlow` options (style properties on the element, timer duration). Reading the theme context in the boundary only, not in controls, keeps G3.
- `darkMiroirTheme` instance: set a glow colour readable on dark backgrounds if the default is not (check by eye in the app).

### Refactor checkpoint

One place for defaults (`resolveThemeColors`); `attachFeedbackGlow` keeps its own fallback for callers without a theme.

### Validation

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-react -- feedbackGlow
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```

(Full nonreg: the Theme schema change regenerates `miroirFundamentalType.ts`.)

### Realization

_(pending)_

---

## Slice 4 — Global switch: AppBar toggle, persisted, off by default

**Status:** ⬜ pending

### Goal

A user turns the glow on for the whole app from the AppBar; it stays on after a reload; it is off on first visit (AC6).

### 4.1 RED → GREEN

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/438-feedback-glow/feedbackGlowGlobalSwitch.438.phase4.unit.test.tsx`

- With an empty `localStorage`, rendering the app shell (`MiroirContextReactProvider` + `AppBar` + the root wiring) leaves `document.documentElement` without `data-miroir-feedback-glow`, and a click on a button adds no class.
- Clicking the AppBar button "Interaction glow: OFF (click to turn on)" sets the attribute to `on` on `document.documentElement`, writes `localStorage.miroirFeedbackGlow = "true"`, and a click on any button, including an option list portalled to `document.body`, glows.
- A fresh render with `localStorage.miroirFeedbackGlow = "true"` starts with the attribute `on`.
- `initialFeedbackGlowEnabled={false}` wins over `localStorage` (test wrappers).

### GREEN

- `MiroirContextReactProvider`: `feedbackGlowEnabled` state from `localStorage`, setter writing back, `initialFeedbackGlowEnabled` prop; context type in `miroir-react`.
- `FeedbackGlowBoundary target="document"`: attaches to `element.ownerDocument.documentElement` instead of its own element (same callback-ref mechanism).
- `RootComponent`: `FeedbackGlowBoundary target="document" enabled={context.feedbackGlowEnabled ? true : "inherit"}`, so the document element carries no attribute when the switch is off.
- `AppBar`: `AppBarIconButton` with a `ThemedIcon` (e.g. MUI `highlight`), coloured when on.

### Refactor checkpoint

Toggling re-renders the context consumers once (same as the other AppBar toggles); no control reads the flag.

### Validation

```bash
npm run build -w miroir-react
RUN_TEST=feedbackGlowGlobalSwitch.438.phase4 npm run testByFile -w miroir-standalone-app -- feedbackGlowGlobalSwitch.438.phase4
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

Manual: toggle in the AppBar, tab through a form, reload.

### Realization

_(pending)_

---

## Slice 5 — Sandbox header toggle

**Status:** ⬜ pending (starts once PR #436 is merged into `_integration`; merge `_integration` into the branch first)

### Goal

A test author turns the glow off (and back on) in the sandbox header, next to the step-delay slider (AC7).

### 5.1 RED → GREEN

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/438-feedback-glow/componentTestSandboxGlow.438.phase5.unit.test.tsx`

- The sandbox header has a checked checkbox "Glow on interactions".
- Unchecking it sets the panel attribute to `off`; a click in the sandbox adds no class, even with the global switch on (innermost decides).
- Checking it again restores the glow.

### GREEN

`ComponentTestSandboxProvider` keeps `sandboxGlowOn` (`useState(true)`), passed to `ComponentTestSandbox`. Mount it with the #435 header controls (they mount only while the panel is open, per #435). In-memory only: the default stays on for every new page load.

### Refactor checkpoint

Header control layout shared with the #435 slider; no duplicate header row.

### Validation

```bash
RUN_TEST=componentTestSandboxGlow npm run testByFile -w miroir-standalone-app -- componentTestSandboxGlow
npm run testByFile -w miroir-standalone-app -- MiroirTestDisplay
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

_(pending)_

---

## Slice 6 — Cost measurement, nonreg step, docs, cleanup, AC

**Status:** ⬜ pending

### 6.1 Cost (AC9)

- Vitest, glow off: rerun the Slice 0 command three times; medians within the Slice 0 run-to-run spread.
- App, glow on vs. off: run `ui.mlElementEditor.renderPerformance` from the Miroir Tests page with the same Iterations, sandbox toggle on, then off. Record both.
- Put the three tables in the PR description.

### 6.2 Nonreg step

Add `unit-438-feedback-glow` (scopes `["ui"]`, tier `unit`) to `scripts/nonreg-manifest.json`, running the feature-named test files of 6.4.

### 6.3 Docs

- `docs/reference/testing.md`, component test sandbox paragraph: the glow and its toggle.
- A short "Interaction glow" section (switch, boundary API, Theme tokens, opt-out attribute) in the developer guide for UI components (pick the closest existing page; `docs/guides/advanced/performance.md` for the cost note).

### 6.4 Cleanup

Move the issue-scoped tests to feature-named files (`packages/miroir-react/tests/feedbackGlow.unit.test.tsx`, `packages/miroir-standalone-app/tests/4_view/feedbackGlow.unit.test.tsx`) with `git mv`, then delete the `issues/438-feedback-glow` directories.

### 6.5 Tracer narrative

Manual: turn the global switch on, tab through a Report's form and click a few buttons; open the Miroir Tests page, run a component suite, watch the steps glow, untick the sandbox toggle, run again. Automated equivalent: the phase 1, 4 and 5 tests.

### AC checklist

| Acceptance criterion (#438) | Proof |
|---|---|
| No listener, no matching CSS with no enabled boundary | Slice 2 (no stylesheet, no class) |
| Focus / click / keyboard activation / commit glow once; typing does not | Slice 1.1 |
| Nested `enabled: false` suppresses, and the reverse | Slice 2 |
| Colour and duration from the theme | Slice 3 |
| Static outline under reduced motion | Slice 3 |
| Global user setting, off by default, survives reload | Slice 4 |
| Sandbox glows by default; header toggle turns it off | Slices 1.2, 5 |
| Existing vitest component tests unchanged | full nonreg (Slices 3, 6) |
| No measurable difference off; before/after in the PR | Slice 6.1 |

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

_(pending)_
