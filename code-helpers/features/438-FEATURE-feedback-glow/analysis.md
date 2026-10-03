# 438 — Feedback glow on focused or activated controls

> A short yellow glow on the control the user (or the in-browser test runner) just focused, clicked, activated or committed. Off by default; enabled for the whole app or inside a boundary such as the Component Test Sandbox. This analysis records the decisions from grilling round 1, the facts they rest on, and two refinements found while reading the code.

Related issue: https://github.com/miroir-framework/miroir/issues/438
Related: #435 (Component Test Sandbox header: running test name and step-delay slider, PR #436, open on 2026-10-03) · #303 (render performance suite) · #286 (component test sandbox)
Related analyses: [`../286-FEATURE-react-component-miroir-tests/`](../286-FEATURE-react-component-miroir-tests/) · [`../303-FEATURE-test-pattern-and-render-performance/`](../303-FEATURE-test-pattern-and-render-performance/)
Key sources: [`MiroirThemeContext.tsx`](../../../packages/miroir-react/src/contexts/MiroirThemeContext.tsx) · [`ThemeColorDefaults.ts`](../../../packages/miroir-react/src/components/Themes/ThemeColorDefaults.ts) · [`MiroirContextReactProvider.tsx`](../../../packages/miroir-react/src/contexts/MiroirContextReactProvider.tsx) · [`ComponentTestSandbox.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox.tsx) · [`runReactComponentTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReactComponentTest.tsx) · [`AppBar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx)

**Status:** decisions confirmed in grilling round 1 (2026-10-03, project file `focus-glow/grilling-round-1.md`); refinements R1, R2 and the callback-ref approach (no `useEffect`) confirmed by A on 2026-10-03. Implementation: see [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

**Document history:** after implementation (2026-10-03), three details differ from the text below, which is kept as written: (1) the document-level boundary is `FeedbackGlowBoundary target="document"`, rendered by `GlobalFeedbackGlow` in `RootComponent`, not a `useDocumentFeedbackGlow` hook (D7, D8); (2) the component test case providers pass `initialFeedbackGlowEnabled={false}` rather than leaving it unset (D10); (3) the "on" cost is measured in vitest with `MIROIR_FEEDBACK_GLOW=1`, which enables a boundary on the vitest sandbox element, rather than in the app (D11). See the plan's Realization sections. After the PR #440 review: (4) the halo is a `filter: drop-shadow(...)` instead of a `box-shadow` (D5, D6), because themed inputs set their focus `box-shadow` with `!important`; (5) Enter in a single-line text field glows it (D3); (6) the stylesheet is reference-counted and removed with the last boundary; (7) the duration is clamped to 100-3000 ms.

---

## 1. Goals

- **G1 — See what I just used.** In order to know which control received my input, as an app user (keyboard or pointer), I can turn on a brief glow on every control I focus, click, activate or commit, for the whole app.
- **G2 — Follow a displayed test run.** In order to understand what a component or report test does while it runs in the browser, as a test author, I can watch each step's target control glow in the Component Test Sandbox, and turn the glow off there.
- **G3 — Pay nothing when off.** In order to keep the app's rendering cost unchanged, as an application maintainer, I can rely on the glow adding no listener, no CSS rule and no re-render when it is off, and no re-render when it is on.
- **G4 — Match my theme.** In order to keep the glow readable on light and dark themes, as a theme designer, I can set its colour and duration in the Theme.

## 2. Non-goals

- Environment (`environments/*.json`) and URL sources for the switch (later, unscheduled; grilling Q8).
- Glow during vitest / happy-dom runs of the component tests (grilling Q10: off there).
- Replacing or restyling the existing focus outlines (`components.input.borderColorFocused` etc.).
- Persisting the switch in the admin `ViewParams` entity (rejected in R2, may be revisited).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Mechanism | **Delegated DOM listeners on a boundary element, scoped CSS, no per-component code, no React state** | G1, G2, G3 |
| D2 Targets | **Any interactive element under the boundary (`closest()`), opt-out `data-miroir-no-glow`** | G1, G2 |
| D3 Triggers | **`focusin`, `click`, `keydown` Enter/Space on non-text targets, `change`; no restart while glowing** | G1, G2 |
| D4 Synthetic events | **Ignore `isTrusted`** | G2 |
| D5 Look | **`box-shadow` glow fading over ~400 ms, colour and duration as Theme tokens** | G4 |
| D6 Reduced motion | **Static glow for the same duration** | G1 |
| D7 Location | **Mechanism in `miroir-react`, wiring in `miroir-standalone-app`** | G1, G2 |
| D8 Configuration | **Nestable boundary, innermost decides; global switch in the React context persisted in `localStorage`, toggled from the AppBar** | G1, G3 |
| D9 Sandbox | **Boundary on by default, toggle in the sandbox header** | G2 |
| D10 Vitest | **No boundary enabled; dedicated mechanism tests** | G3 |
| D11 Cost proof | **Before/after `ui.mlElementEditor.renderPerformance` runs** | G3 |
| R1 Glow end | **Timer, not `animationend`** (refines issue decision 1) | G1, G3 |
| R2 Switch storage | **`localStorage` next to the existing AppBar display toggles, not ViewParams** (settles the open point of issue decision 8) | G1 |

**Rationale:** the glow is a pure DOM effect. Keeping it out of React (no state, no context read in components) is what makes "off" free and "on" render-neutral, and DOM delegation is the only route that also covers the sandbox, where each test case is a separate React root (§4.3).

### D1 — Mechanism

**Status:** Accepted (grilling Q1). **Serves:** G1, G2, G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Delegated DOM listeners** ★ | `attachFeedbackGlow(element)` sets `data-miroir-feedback-glow="on"` and adds capture-phase listeners on the element; the handler finds the target control and adds the class `miroir-feedback-glow` | One listener set per boundary; covers non-themed widgets, separate React roots and portals rendered inside the boundary | Portals rendered outside a scoped boundary are missed (§4.4) |
| D1-b. React capture handlers (`onFocusCapture` …) on a boundary `div` | React synthetic events | Follows React portals | Does not see events from other React roots: misses every sandbox case (§4.3) |
| D1-c. Code in each `Themed*` component | Hook per component | Fine-grained | 75 components to touch; a hook call per render even when off (fails G3) |

**Decision:** D1-a. The React component `FeedbackGlowBoundary` and the document-level hook are thin wrappers over `attachFeedbackGlow`.

### D2 — Targets

**Status:** Accepted (grilling Q2). The handler resolves the target with `event.target.closest(selector)` where the selector is `button, input, select, textarea, [role=button], [role=option], [role=checkbox], [role=tab], [role=menuitem], [tabindex]:not([tabindex="-1"])`, then drops it when `closest("[data-miroir-no-glow]")` is inside the boundary. Options of `ThemedSelectWithPortal` carry `role="option"` (`FormComponents.tsx`, option `li` around line 710), so a chosen option glows.

### D3 — Triggers

**Status:** Accepted (grilling Q3). Listeners: `focusin`, `click`, `change`, `keydown`. `keydown` only counts Enter and Space, and only when the target is not a text field (`input` other than checkbox/radio/button types, `textarea`, `[contenteditable]`), so typing never flashes. Native `change` fires on commit (blur, Enter, option chosen), not per keystroke; React's `onChange` listens to `input`, which the glow ignores. A control already glowing is not restarted: a click that also moves focus flashes once.

### D4 — Synthetic events

**Status:** Accepted (grilling Q4). The runner uses `@testing-library` `fireEvent` and `userEvent` (`componentTestEnvironment.ts`); their events have `isTrusted === false` and still reach DOM listeners, so the handler does not check `isTrusted`.

### D5 — Look

**Status:** Accepted (grilling Q5). New optional Theme attribute `components.feedbackGlow: { color?: string, durationMs?: number }`, resolved in `resolveThemeColors` (defaults `#ffd54f`, `400`). The boundary writes them as CSS custom properties (`--miroir-feedback-glow-color`, `--miroir-feedback-glow-duration`) on its element; the stylesheet reads the properties, so one stylesheet serves every boundary and theme. The animation animates `box-shadow` only (no layout change). A control with its own `box-shadow` (MUI elevation) loses it for the duration of the flash.

### D6 — Reduced motion

**Status:** Accepted (grilling Q6). `@media (prefers-reduced-motion: reduce)` replaces the animation with a static `box-shadow` on the same class. With R1 the class is removed by the same timer in both cases.

### D7 — Location

**Status:** Accepted (grilling Q7). `miroir-react`: `attachFeedbackGlow`, the stylesheet injector, `FeedbackGlowBoundary`, `useDocumentFeedbackGlow`, and the theme defaults. `miroir-app-miroir`: the Theme `mlSchema` attribute. `miroir-standalone-app`: AppBar toggle, `RootComponent` wiring, sandbox wiring.

### D8 — Configuration

**Status:** Accepted (grilling Q8) with R2 for storage. `FeedbackGlowBoundary` takes `enabled: boolean | "inherit"`. `true` sets the attribute to `on` and attaches listeners; `false` sets it to `off` and attaches nothing; `"inherit"` renders no attribute. A boundary's handler acts only when the target's nearest `[data-miroir-feedback-glow]` ancestor is its own element, so the innermost boundary decides. The global boundary is the document element (`document.documentElement`), attached by `useDocumentFeedbackGlow(enabled)` in `RootComponent`, which covers portals to `document.body`.

### D9 — Sandbox

**Status:** Accepted (grilling Q9). `ComponentTestSandbox` wraps its panel in `FeedbackGlowBoundary enabled={sandboxGlowOn}`, default `true`, with a checkbox "Glow on interactions" in the header next to the #435 step-delay slider. The sandbox element holds every case container and the portal element (§4.3), so all steps are covered.

### D10 — Vitest

**Status:** Accepted (grilling Q10). No boundary is attached in vitest runs: the vitest runner renders cases without `ComponentTestSandbox`, and `MiroirContextReactProvider` gets an `initialFeedbackGlowEnabled` prop (like `initialShowPerformanceDisplay`) that test wrappers leave unset, so the default `false` holds. The mechanism has its own vitest file in `miroir-react` under happy-dom (not reachable through MiroirTest: it is DOM machinery with no ML surface).

### D11 — Cost proof

**Status:** Accepted (grilling Q11). The on-demand suite is now `ui.mlElementEditor.renderPerformance` (uuid `2da30877-d248-44bd-9786-5c091b1bc8fc`). Its vitest run (`MIROIR_COMPONENT_PERF=1`) measures "off" against an `_integration` baseline. "On" is measured in the app sandbox (glow on vs. toggle off, same Iterations), since vitest never enables a boundary.

### R1 — End of the glow: timer instead of `animationend`

**Status:** Accepted (A, 2026-10-03). **Serves:** G1, G3.

| Option | Pros | Cons |
|---|---|---|
| **R1-a. `setTimeout(durationMs)` per flash** ★ | Works under reduced motion (static glow, no animation, so no `animationend`) and in happy-dom (no animation events); one timer per flash | One timer per flash |
| R1-b. `animationend` (issue decision 1) | No timer | Never fires for the static reduced-motion glow, nor in happy-dom; the class would stay |

### R2 — Storage of the global switch

**Status:** Accepted (A, 2026-10-03; issue decision 8 left it open). **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R2-a. React context + `localStorage`** ★ | `feedbackGlowEnabled` / `setFeedbackGlowEnabled` in `MiroirReactContext`, same shape as `showPerformanceDisplay` / `showDebugInfo` (which use `sessionStorage`), toggled by an `AppBarIconButton` | Same pattern as the AppBar display toggles; per browser, survives restarts; no schema change | Not shared across browsers |
| R2-b. Admin `ViewParams` attribute (as #435 did for `componentTestStepDelayMs`) | New attribute in the ViewParams entity `b9765b7c-b614-4126-a0e2-634463f99937` `mlSchema`, `ViewParamsData`, `ViewParamsUpdateQueue` | Stored with the other view preferences (`appTheme`, `generalEditMode`) | Admin schema change and rebuild for a display preference; shared by every browser of that deployment |
| R2-c. `sessionStorage` like the other toggles | as R2-a | Identical to neighbours | Lost when the browser closes; an accessibility setting should persist |

**Decision:** R2-a. R2-b may be revisited if view preferences move to ViewParams wholesale.

---

## 4. Current state

### 4.1 Themes (aligned; one attribute to add)

- Themes are instances of the Entity `Theme` (uuid `bdcf956a-771d-40a1-a878-06e0bf6efd3e`, `miroir-app-miroir/assets/miroir_model/16dbfe28-…/bdcf956a-….json`). Four instances in `miroir-app-miroir/assets/miroir_data/bdcf956a-…/`: `defaultMiroirTheme` (`919803c4-…`), `darkMiroirTheme` (`b327b9c0-…`), `compactMiroirTheme` (`edd44b02-…`), `materialMiroirTheme` (`3c3b4845-…`).
- The generated Zod type `miroirThemeFull` makes `definition.components` `.strict()`, with keys `appBar, sidebar, drawer, input, button, card, dialog, tooltip, icon`. A `feedbackGlow` key therefore needs an `mlSchema` change, `npm run build -w miroir-app-miroir`, then `npm run devBuild -w miroir-core`.
- `resolveThemeColors` (`ThemeColorDefaults.ts:170`) is the single place where optional component tokens get defaults, e.g. `borderColorFocused: theme?.components?.input?.borderColorFocused ?? colors.accent`.
- `useMiroirTheme()` (`MiroirThemeContext.tsx:127`) returns the resolved `currentTheme`.

### 4.2 Global display toggles (pattern to follow)

- `MiroirContextReactProvider` holds `showPerformanceDisplay`, `showDebugInfo`, `showAiSidebar` as `useState` initialised from `sessionStorage`, with setters that write back (lines ~413-450, ~711-750), and `initialShowPerformanceDisplay` overrides the initial value for tests (line 259).
- `AppBar.tsx` renders one `AppBarIconButton` per toggle, with `title` "…: ON (click to hide)" / "…: OFF (click to show)" and a `ThemedIcon` coloured when on.
- No global CSS is injected by `miroir-react` today; `spinner.ts` declares `@keyframes miroir_spin` through an emotion style object, and `CenteredSpinner` relies on keyframes in `src/index.html`.
- Nothing in the repo handles `prefers-reduced-motion`.

### 4.3 Component Test Sandbox (aligned with D1-a)

- `ComponentTestSandboxProvider` (`ComponentTestSandbox.tsx`) owns `sandboxRef`, the `data-testid="component-test-sandbox"` element. The comment there: "Never a render target: the runner adds one container per case and a portal element."
- `createReactComponentTestRunner` (`runReactComponentTest.tsx`, ~line 96) creates the portal element as a child of the sandbox element and mounts each case in its own container and React root, inside `PortalContainerProvider`. So every case's DOM, option lists and MUI popups sit under the sandbox element, but in React roots separate from the app tree. React capture handlers on the app side would not see their events (rejects D1-b); a native listener on the sandbox element does.
- Vitest runs use the same runner without `ComponentTestSandbox` (D10 holds without extra code).
- #435 (PR #436, not merged on 2026-10-03) adds the header with the running test name and the step-delay slider; the D9 toggle sits next to it.

### 4.4 Portals in the app (scoped boundaries: known limit)

- `ThemedSelectWithPortal` portals its option list to `usePortalContainer()`, which is `document.body` outside the sandbox (`PortalContainerContext.ts`). `TestResultCellWithActualValue` and `TestCellWithDetails` also portal to the body.
- Consequence: under a scoped boundary in the app (not the sandbox), option clicks happen outside the boundary and do not glow unless the global switch is on. The select's own focus and commit still glow. Accepted as a limit; the sandbox is not affected (§4.3).

### 4.5 Render performance suite

- `ui.mlElementEditor.renderPerformance` (`miroir-app-miroir/assets/miroir_data/a311f363-…/2da30877-d248-44bd-9786-5c091b1bc8fc.json`) is `runOnDemand`; vitest runs it with `MIROIR_COMPONENT_PERF=1 npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlEditorRenderPerformance"` (header of `tests/4_view/miroir-component-tests.unit.test.tsx`); the app runs it from the Miroir Tests page with the Iterations field (#303).

### 4.6 Test environment

- `miroir-react` vitest runs in the `node` environment (`packages/miroir-react/vitest.config.ts`), one test file (`tests/schemaReloadPolicy.unit.test.ts`), no DOM library in its devDependencies. `miroir-standalone-app` uses `happy-dom` 20.14.5. The mechanism tests need a per-file `// @vitest-environment happy-dom` and `happy-dom` 20.14.5 as a `miroir-react` devDependency.

## 5. Key reuse

| Piece | Location |
|---|---|
| Theme Entity / instances | `bdcf956a-771d-40a1-a878-06e0bf6efd3e`, 4 instances in `miroir-app-miroir/assets/miroir_data/bdcf956a-…/` |
| Token defaults | `resolveThemeColors`, `ThemeColorDefaults.ts` |
| Theme hook | `useMiroirTheme`, `MiroirThemeContext.tsx` |
| Toggle state pattern | `showPerformanceDisplay` + `initialShowPerformanceDisplay`, `MiroirContextReactProvider.tsx` |
| Toggle button | `AppBarIconButton`, `AppBar.tsx` |
| Sandbox element | `ComponentTestSandbox` / `ComponentTestSandboxProvider`, `ComponentTestSandbox.tsx` |
| Runner (synthetic events) | `componentTestEnvironment.ts`, `runReactComponentTest.tsx` |
| Perf suite | `ui.mlElementEditor.renderPerformance`, `2da30877-d248-44bd-9786-5c091b1bc8fc` |

## 6. Risks

| Risk | Mitigation |
|---|---|
| Glow clipped by `overflow: hidden` parents (AG-grid cells) | Accept; the shadow spread stays small (3px). Revisit with an inset variant if it proves unreadable |
| Glow hides a control's own `box-shadow` for 400 ms | Accept (D5) |
| Stylesheet injected per document; Electron and the app share one | Inject once per `Document`, keyed by a `WeakSet<Document>` |
| Merge order with #435 | The sandbox toggle slice comes after #436 is merged; the default-on wiring does not need it |
