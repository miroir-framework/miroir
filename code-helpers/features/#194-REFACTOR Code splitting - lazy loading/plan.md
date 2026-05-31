# #194 — Code Splitting / Lazy Loading Plan

## Context

Initial page load is too slow. The goal is to display a spinner as fast as possible (before any JS executes) and push all non-critical JS to background lazy chunks, with **zero regressions** across standalone, sandbox, electron, and integration tests.

### Codebase facts (verified)

| Fact | Detail |
|------|--------|
| Router | `createBrowserRouter` with a single route → `RootComponent` → `PageDispatcher` (switches on `?page=`) |
| Lazy loading today | **None** — all imports are static |
| Route components | 10 pages in `PageDispatcher` (see table below) |
| Always-mounted off-screen components | `AiActionsProvider`, `InstanceEditorOutline`, `EventTimelineContainer` |
| Test harness | Tests render individual components via `renderWithProviders` — never mount `RootComponent` or `PageDispatcher` → **not affected by lazy loading changes** |
| Sandbox | Uses `createHashRouter`, no CopilotKit provider, guarded by `VITE_STATIC_DEMO` |

---

## Decisions

| # | Question | Decision |
|---|----------|----------|
| Q1 | Query-param vs path-based routing | Keep `?page=` query params — no URL restructuring |
| Q2 | Spinner before React mounts | Static CSS spinner in `index.html`, removed on first React render |
| Q3 | Spinner during lazy chunk download | React `<Suspense fallback={<CenteredSpinner/>}>` full-screen spinner |
| Q4 | AiActionsProvider lazy strategy | `React.lazy()` + eager mount (lazy chunk, always-mounted contract preserved) |
| Q5 | Page component splitting | All 10 pages individually lazy via `React.lazy()` |
| Q6 | Suspense boundary location | Inside `PageDispatcher` (co-located with lazy calls) |
| Q7 | Off-screen always-mounted components | `React.lazy()` + `<Suspense fallback={null}>` (silent) for `InstanceEditorOutline` and `EventTimelineContainer` |
| Q8 | Vendor chunk pinning | `manualChunks` in `vite.config.js` for `@copilotkit/*`, `d3`, `ag-grid-*`, `@mui/material` |
| Q9 | Test impact | None — tests render individual components, never `PageDispatcher`/`RootComponent` |
| Q10 | Spinner style | Neutral light-grey (works before theme loads, no flash) |

---

## Implementation Plan

### Step 1 — HTML bootstrap spinner (standalone + sandbox `index.html`)

Add a pure-CSS full-screen spinner to both `index.html` files. It is visible from the very first byte of HTML, covering the blank window during JS parse + `startWebApp()` async init.

**Files:** `packages/miroir-standalone-app/index.html`, `packages/miroir-sandbox/index.html`

```html
<!-- inside <head> -->
<style>
  #miroir-bootstrap-spinner {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: #f5f5f5; z-index: 9999;
  }
  .miroir-spinner {
    width: 56px; height: 56px;
    border: 5px solid #cccccc;
    border-top-color: #888888;
    border-radius: 50%;
    animation: miroir-spin 0.9s linear infinite;
  }
  @keyframes miroir-spin { to { transform: rotate(360deg); } }
</style>

<!-- inside <body> before <div id="root"> -->
<div id="miroir-bootstrap-spinner">
  <div class="miroir-spinner"></div>
</div>
```

Remove it on first React render (in `RootComponent` or the top-level app component):

```tsx
// Once on mount — remove the HTML bootstrap spinner
React.useEffect(() => {
  document.getElementById("miroir-bootstrap-spinner")?.remove();
}, []);
```

---

### Step 2 — `CenteredSpinner` React component

Create a minimal spinner component (no MUI dependency, pure inline styles) for use as `<Suspense>` fallbacks:

**New file:** `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/CenteredSpinner.tsx`

```tsx
import React from "react";

export function CenteredSpinner(): React.JSX.Element {
  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f5f5f5",
    }}>
      <div style={{
        width: 56, height: 56,
        border: "5px solid #cccccc",
        borderTopColor: "#888888",
        borderRadius: "50%",
        animation: "miroir-spin 0.9s linear infinite",
      }} />
    </div>
  );
}
```

The `@keyframes miroir-spin` is already defined in `index.html`'s inline style, so it's available immediately.

---

### Step 3 — Lazy pages in `PageDispatcher`

**File:** `packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx`

Convert all 10 static page imports to `React.lazy()` and wrap the render in `<Suspense>`:

```tsx
// Before:
import { HomePage } from "./routes/HomePage.js";
import { ReportDisplay } from "./routes/ReportDisplay.js";
// ... 8 more static imports

// After:
const HomePage             = React.lazy(() => import("./routes/HomePage.js"));
const ReportDisplay        = React.lazy(() => import("./routes/ReportDisplay.js"));
const ModelDiagramPage     = React.lazy(() => import("./routes/ModelDiagramPage.js"));
const TransformerBuilderPage = React.lazy(() => import("./routes/TransformerBuilderPage.js"));
const SearchPage           = React.lazy(() => import("./routes/SearchPage.js"));
const SettingsPage         = React.lazy(() => import("./routes/SettingsPage.js"));
const RunnersPage          = React.lazy(() => import("./routes/Runners.js"));
const CheckPage            = React.lazy(() => import("./routes/Check.js"));
const MiroirEventsPage     = React.lazy(() => import("./pages/MiroirEventsPage.js"));
const ReportPage           = React.lazy(() => import("./routes/ReportPage.js")); // legacy, kept for safety
```

Wrap the return with `<Suspense>`:

```tsx
return (
  <Suspense fallback={<CenteredSpinner />}>
    {/* existing switch-on-page-param logic unchanged */}
  </Suspense>
);
```

**No changes to `?page=` URL logic.**

---

### Step 4 — Lazy off-screen always-mounted components in `RootComponent`

**File:** `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx`

Convert 3 always-mounted but initially-invisible components to lazy with silent fallback:

```tsx
// Before (static imports):
import { AiActionsProvider } from "../../routes/ai/AiActionsProvider.js";
import { InstanceEditorOutline } from "../InstanceEditorOutline.js";
import { EventTimelineContainer } from "../EventTimeline/EventTimelineContainer.js";

// After:
const AiActionsProvider      = React.lazy(() => import("../../routes/ai/AiActionsProvider.js"));
const InstanceEditorOutline  = React.lazy(() => import("../InstanceEditorOutline.js"));
const EventTimelineContainer = React.lazy(() => import("../EventTimeline/EventTimelineContainer.js"));
```

Wrap each usage with `<Suspense fallback={null}>` (silent — they render nothing visible at startup):

```tsx
<Suspense fallback={null}><AiActionsProvider /></Suspense>
<Suspense fallback={null}><InstanceEditorOutline /></Suspense>
<Suspense fallback={null}><EventTimelineContainer /></Suspense>
```

---

### Step 5 — Bootstrap spinner removal in `RootComponent`

Add to `RootComponent`:

```tsx
React.useEffect(() => {
  document.getElementById("miroir-bootstrap-spinner")?.remove();
}, []); // empty deps — fires once on first mount
```

---

### Step 6 — `manualChunks` in `vite.config.js`

**File:** `packages/miroir-standalone-app/vite.config.js`

Add to `build.rollupOptions`:

```js
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes("node_modules/@copilotkit")) return "vendor-copilotkit";
        if (id.includes("node_modules/d3") || id.includes("node_modules/miroir-diagram-class")) return "vendor-d3";
        if (id.includes("node_modules/ag-grid")) return "vendor-ag-grid";
        if (id.includes("node_modules/@mui/material") || id.includes("node_modules/@mui/icons-material")) return "vendor-mui";
      },
    },
  },
},
```

This pins those 4 vendor groups to stable named chunks. They only change when the lib version changes, enabling long-lived browser cache hits across app deploys.

---

## Resulting chunk loading sequence

```
HTML parsed
  └─ #miroir-bootstrap-spinner visible immediately (pure CSS)
  └─ main.js starts loading
       └─ startWebApp() async init (stores, domain controller)
            └─ ReactDOM.render() called
                 └─ RootComponent mounts → removeChild(bootstrap-spinner)
                 └─ AppBar + Sidebar render immediately (in main bundle)
                 └─ <Suspense fallback={<CenteredSpinner/>}> in PageDispatcher
                      └─ lazy page chunk downloads in background
                           └─ page content renders
                 └─ Lazy off-screen chunks download silently in background:
                      AiActionsProvider (vendor-copilotkit)
                      InstanceEditorOutline
                      EventTimelineContainer
```

---

## Scope / non-goals

- No changes to `?page=` query-param URLs
- No changes to test utilities (`renderWithProviders`, `renderWithProvidersWithContextProvider`)
- No changes to how tests select/render individual components
- Sandbox handled automatically: `AiActionsProvider` already guarded by `VITE_STATIC_DEMO`; lazy import of it is fine since the guarded export returns `<></>` when in sandbox
- Electron: no special handling needed; lazy chunks are served from the same origin as in webapp mode
- No changes to integration test runner infrastructure

---

## Files to change

| File | Change |
|------|--------|
| `packages/miroir-standalone-app/index.html` | Add bootstrap spinner HTML + CSS |
| `packages/miroir-sandbox/index.html` | Add bootstrap spinner HTML + CSS |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx` | Replace 10 static imports with `React.lazy()`, add `<Suspense>` |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx` | Lazy `AiActionsProvider`, `InstanceEditorOutline`, `EventTimelineContainer`; remove bootstrap spinner on mount |
| `packages/miroir-standalone-app/vite.config.js` | Add `manualChunks` for 4 vendor groups |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/CenteredSpinner.tsx` | **New** — minimal CSS spinner component |
