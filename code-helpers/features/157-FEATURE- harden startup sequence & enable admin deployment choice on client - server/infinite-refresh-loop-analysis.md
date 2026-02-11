# Infinite Refresh Loop Analysis — Details Report Page

**Date:** 2026-02-11  
**URL:** `http://localhost:5173/report/5af03c98-fe5e-490b-b08f-e1230971c57f/cd1aa372-aa52-41ec-bd8a-537021bfe634/data/8adee3d5-f8cc-4118-aa02-5a2cd07908aa/04c371ed-702d-4dd9-a06d-8a04eda5d24f`

## Component Rendering Chain

```
ReportPage → ReportDisplay → ReportViewWithEditor (Formik) 
  → ReportSectionViewWithEditor → ReportSectionEntityInstance 
    → TypedValueObjectEditor → JzodElementEditor → JzodObjectEditor (recursive)
```

Context Providers in the tree:
- `MiroirContextReactProvider` (global app state)
- `DocumentOutlineContextProvider` (outline, typeCheckKeyMap)
- `ReportPageContextProvider` (foldedObjectAttributeOrArrayItems)

## Root Causes Identified

### 1. CRITICAL — `useEffect` without dependency arrays in ReportPage.tsx (L58-63)

```tsx
useEffect(() =>
  context.setDeploymentUuid(pageParams.deploymentUuid ? pageParams.deploymentUuid : "")
);
useEffect(() =>
  context.setApplicationSection((pageParams.applicationSection as ApplicationSection) ?? "data")
);
```

These two `useEffect` hooks have **no dependency arrays**, meaning they execute after **every single render**. They call state setters on `MiroirContextReactProvider`, which recreates the context value object (via `useMemo` with `deploymentUuid` and `applicationSection` in its deps), triggering re-renders of **all** context consumers.

While React's `useState` bails out for identical primitive values, this creates unnecessary effect scheduling on every render cycle and during the initial mount causes a guaranteed extra render cycle (deploymentUuid going from `""` to the actual UUID).

**Fix:** Add dependency arrays `[pageParams.deploymentUuid]` and `[pageParams.applicationSection]` respectively.

### 2. CRITICAL — State setter called in render body in InstanceEditorOutlineContext.tsx (L97-100)

```tsx
context.setSetTypeCheckKeyMap((a) => {
  return setTypeCheckKeyMap
});
```

This is called **directly in the component's render function body** — not inside a `useEffect`, `useMemo`, or `useCallback`. On every render of `DocumentOutlineContextProvider`, this calls `setSetTypeCheckKeyMap` on `MiroirContextReactProvider`. Since it passes a function, React interprets it as a functional updater. In theory, `Object.is(prevState, nextState)` should bail out since `setTypeCheckKeyMap` is a stable reference. However, this is a **React anti-pattern** (side effects during render) and contributes to the instability cascade.

**Fix:** Wrap in `useEffect` with appropriate deps.

### 3. HIGH — `jzodTypeCheckResult` → `setTypeCheckKeyMap` cascade in TypedValueObjectEditor.tsx (L340-356)

```tsx
useEffect(() => {
  if (jzodTypeCheckResult?.status == "ok" && jzodTypeCheckResult.keyMap) {
    context.setTypeCheckKeyMap(jzodTypeCheckResult.keyMap);
  }
}, [jzodTypeCheckResult]);
```

`jzodTypeCheckResult` is computed via `useMemo` with `context` (the **entire** MiroirReactContext object) as a dependency (line ~322). Whenever any state in `MiroirContextReactProvider` changes, `context` gets a new reference, `jzodTypeCheckResult` is recomputed, producing a new object reference, which triggers this `useEffect`.

The `useEffect` then calls `context.setTypeCheckKeyMap()` which updates state in `DocumentOutlineContextProvider`, recreating `outlineContextValue`, re-rendering all outline context consumers.

This creates a cascading re-render: MiroirContext change → TypedValueObjectEditor recomputes → sets typeCheckKeyMap → outline context changes → children re-render.

**Fix:** Remove `context` from the `jzodTypeCheckResult` useMemo deps; use only the specific context properties needed (`context.miroirFundamentalJzodSchema`).

### 4. HIGH — `useEffect` without dependency arrays for performance tracking

In both `JzodElementEditor.tsx` (L1268) and `TypedValueObjectEditor.tsx` (L649):

```tsx
useEffect(() => {
  if (context.showPerformanceDisplay) {
    // track performance...
  }
});
```

These run after **every render** without deps. While they don't set React state, they add overhead and scheduling pressure in an already hot render path. For a tree of JzodElementEditor instances, this multiplies the effect.

**Fix:** Add dependency arrays.

### 5. MEDIUM — `outlineContext.setReportInstance(instance)` in ReportSectionEntityInstance.tsx (L421-433)

```tsx
useEffect(() => {
  if (currentReportTargetEntity?.name) {
    outlineContext.setOutlineTitle(currentReportTargetEntity.name + " details");
    outlineContext.setReportInstance(instance);
  }
}, [currentReportTargetEntity?.name, instance, outlineContext.setOutlineTitle]);
```

`instance` depends on `formikContext?.values` (via `useMemo`). With `enableReinitialize={true}` on Formik, if `initialValues` changes reference, Formik reinitializes, creating new `values`, creating a new `instance`, triggering this `useEffect`, which updates the outline context, which re-renders consumers.

### 6. LOW — Large `useMemo` dependency array for MiroirReactContext value

The context value in `MiroirContextReactProvider` (L477-580) has ~30 dependencies. Any single change causes all consumers to re-render. This amplifies all of the above issues.

## Cascade Diagram

```
ReportPage renders (any reason)
  ↓ useEffect (NO DEPS): context.setDeploymentUuid()
  ↓ useEffect (NO DEPS): context.setApplicationSection()
  ↓ 
MiroirContextReactProvider state change (first render: "" → actual UUID)
  ↓ New context value (useMemo deps changed)
  ↓
ALL consumers re-render
  ↓
TypedValueObjectEditor re-renders
  ↓ jzodTypeCheckResult useMemo recomputes (depends on `context`)
  ↓ Produces NEW object reference
  ↓ useEffect fires: context.setTypeCheckKeyMap(keyMap)
  ↓
DocumentOutlineContextProvider state change
  ↓ New outlineContextValue (useMemo deps changed)
  ↓
ReportSectionEntityInstance re-renders (outline context consumer)
  ↓ instance may have new reference
  ↓ useEffect: outlineContext.setReportInstance(instance)
  ↓
DocumentOutlineContextProvider state change AGAIN
  ↓ More re-renders cascade...
```

The loop should theoretically stabilize after 2-3 cycles (stable references reached), BUT the combination of multiple `useEffect` hooks without deps, state setters in render bodies, and cascading context changes can overwhelm React's batching and bail-out mechanisms, especially in development mode with StrictMode double-rendering.

## Recommended Fixes (Priority Order)

1. **ReportPage.tsx L58-63**: Add dependency arrays to both `useEffect` hooks
2. **InstanceEditorOutlineContext.tsx L97-100**: Move `context.setSetTypeCheckKeyMap()` into a `useEffect`
3. **TypedValueObjectEditor.tsx L322**: Remove `context` from `jzodTypeCheckResult` useMemo deps, use specific properties
4. **JzodElementEditor.tsx L1268** and **TypedValueObjectEditor.tsx L649**: Add dependency arrays to performance tracking `useEffect` hooks
5. **ReportSectionEntityInstance.tsx L421**: Stabilize `instance` reference or add a deep equality check


## fix other error



User: There's an infinite refresh loop when displaying a details report from #file:ReportPage.tsx which likely goes through #file:JzodElementEditor.tsx . a good example is displaying `http://localhost:5173/report/5af03c98-fe5e-490b-b08f-e1230971c57f/cd1aa372-aa52-41ec-bd8a-537021bfe634/data/8adee3d5-f8cc-4118-aa02-5a2cd07908aa/04c371ed-702d-4dd9-a06d-8a04eda5d24f` (this url is accessible right now). Do a thorough code review for potential sources of cyclic refresh, produce a synthetic md document with your findings, then proceed to solving the problem at hand, using a test-based approach if possible. 


installHook.js:1 Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render. Error Component Stack
    at ThemedSelectWithPortal (FormComponents.tsx:93:3)
    at div (<anonymous>)
    at span (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedLabeledEditor (FormComponents.tsx:30:9)
    at JzodEnumEditor (JzodEnumEditor.tsx:232:3)
    at span (<anonymous>)
    at div (<anonymous>)
    at JzodElementEditor (JzodElementEditor.tsx:308:32)
    at ErrorBoundary (react-error-boundary.js?v=9a77ae9c:32:5)
    at div (<anonymous>)
    at ProgressiveAttribute (JzodObjectEditor.tsx:180:3)
    at div (<anonymous>)
    at div (<anonymous>)
    at JzodObjectEditor (JzodObjectEditor.tsx:382:5)
    at span (<anonymous>)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedCardContent (DisplayComponents.tsx:272:3)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedCard (DisplayComponents.tsx:246:3)
    at div (<anonymous>)
    at JzodElementEditor (JzodElementEditor.tsx:308:32)
    at ErrorBoundary (react-error-boundary.js?v=9a77ae9c:32:5)
    at form (<anonymous>)
    at TypedValueObjectEditor (TypedValueObjectEditor.tsx:126:3)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedContainer (BasicComponents.tsx:27:3)
    at ReportSectionEntityInstance (ReportSectionEntityInstance.tsx:160:25)
    at div (<anonymous>)
    at ReportSectionViewWithEditor (ReportSectionViewWithEditor.tsx:95:19)
    at div (<anonymous>)
    at div (<anonymous>)
    at ReportSectionViewWithEditor (ReportSectionViewWithEditor.tsx:95:19)
    at Formik (formik.js?v=9a77ae9c:2793:19)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at Box3 (chunk-BKTQHO7D.js?v=9a77ae9c:6012:19)
    at ReportViewWithEditor (ReportViewWithEditor.tsx:61:72)
    at ErrorBoundary (react-error-boundary.js?v=9a77ae9c:32:5)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedBox (LayoutComponents.tsx:88:3)
    at ReportDisplay (ReportDisplay.tsx:59:9)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at Box3 (chunk-BKTQHO7D.js?v=9a77ae9c:6012:19)
    at PageContainer (PageContainer.tsx:29:3)
    at ReportPage (ReportPage.tsx:38:50)
    at RenderedRoute (react-router-dom.js?v=9a77ae9c:4123:5)
    at Outlet (react-router-dom.js?v=9a77ae9c:4530:26)
    at main (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedMainPanel (LayoutComponents.tsx:438:3)
    at div (<anonymous>)
    at chunk-FEU4T2JB.js?v=9a77ae9c:1485:49
    at ThemedGrid (LayoutComponents.tsx:236:3)
    at ReportPageContextProvider (ReportPageContext.tsx:49:5)
    at MiroirThemeProvider (MiroirThemeContext.tsx:40:3)
    at DocumentOutlineContextProvider (InstanceEditorOutlineContext.tsx:86:41)
    at RootComponent (RootComponent.tsx:128:45)
    at RenderedRoute (react-router-dom.js?v=9a77ae9c:4123:5)
    at RenderErrorBoundary (react-router-dom.js?v=9a77ae9c:4083:5)
    at DataRoutes (react-router-dom.js?v=9a77ae9c:5278:5)
    at Router (react-router-dom.js?v=9a77ae9c:4537:15)
    at RouterProvider (react-router-dom.js?v=9a77ae9c:5092:5)
    at MiroirContextReactProvider (MiroirContextReactProvider.tsx:200:56)
    at Provider (react-redux.js?v=9a77ae9c:1260:3)
    at StyledEngineProvider (chunk-BKTQHO7D.js?v=9a77ae9c:101:5)
    at DefaultPropsProvider (chunk-BKTQHO7D.js?v=9a77ae9c:6449:3)
    at RtlProvider (chunk-BKTQHO7D.js?v=9a77ae9c:6419:5)
    at ThemeProvider (chunk-BKTQHO7D.js?v=9a77ae9c:6368:5)
    at ThemeProvider2 (chunk-BKTQHO7D.js?v=9a77ae9c:6527:5)
    at ThemeProvider (chunk-ZM6OJZTD.js?v=9a77ae9c:325:12)
overrideMethod @ installHook.js:1
printWarning @ chunk-YQJMHIZ2.js?v=9a77ae9c:7959
error @ chunk-YQJMHIZ2.js?v=9a77ae9c:7943
checkForNestedUpdates @ chunk-YQJMHIZ2.js?v=9a77ae9c:27131
scheduleUpdateOnFiber @ chunk-YQJMHIZ2.js?v=9a77ae9c:25999
dispatchSetState @ chunk-YQJMHIZ2.js?v=9a77ae9c:19861
(anonymous) @ FormComponents.tsx:214
commitHookEffectListMount @ chunk-YQJMHIZ2.js?v=9a77ae9c:24374
commitPassiveMountOnFiber @ chunk-YQJMHIZ2.js?v=9a77ae9c:25622
commitPassiveMountEffects_complete @ chunk-YQJMHIZ2.js?v=9a77ae9c:25595
commitPassiveMountEffects_begin @ chunk-YQJMHIZ2.js?v=9a77ae9c:25585
commitPassiveMountEffects @ chunk-YQJMHIZ2.js?v=9a77ae9c:25575
flushPassiveEffectsImpl @ chunk-YQJMHIZ2.js?v=9a77ae9c:26956
flushPassiveEffects @ chunk-YQJMHIZ2.js?v=9a77ae9c:26913
(anonymous) @ chunk-YQJMHIZ2.js?v=9a77ae9c:26794
workLoop @ chunk-YQJMHIZ2.js?v=9a77ae9c:486
flushWork @ chunk-YQJMHIZ2.js?v=9a77ae9c:465
performWorkUntilDeadline @ chunk-YQJMHIZ2.js?v=9a77ae9c:673

Starting: *Fix jzodTypeCheckResult context dep* (8/10)


The error is "Maximum update depth exceeded" — a `setState` inside `useEffect` where a dependency changes every render, creating an infinite loop. The stack trace points to `ThemedSelectWithPortal` → `JzodEnumEditor` → `JzodElementEditor` → `JzodObjectEditor`. Let me examine these components.   

Found it. The full infinite cycle is:

1. `useEndpointsOfApplications()` creates a **new object on every render** (no `useMemo`, builds via `{ ...result, ...model }`)
2. This busts `useCurrentModelEnvironment`'s `useMemo` → new `currentMiroirModelEnvironment` ref
3. This busts `jzodTypeCheckResult` `useMemo` → new result with new `keyMap`
4. `useEffect` fires → `context.setTypeCheckKeyMap(newKeyMap)` → updates DocumentOutlineContext state
5. `ReportSectionEntityInstance` re-renders (consumes DocumentOutlineContext)
6. `TypedValueObjectEditor` re-renders as child → back to step 1

Additionally, `Object.keys(applicationDeploymentMap)` in `useCurrentModelEnvironment` creates a new array every render, further busting any potential memoization.

The root cause was **not** a missing dependency array. The "Maximum update depth exceeded" error was caused by an **infinite re-render cycle** through this chain:

1. **`useEndpointsOfApplications()`** in ReduxHooks.ts created a **new object on every render** — the `{ ...result, ...model }` spread and `.map()` were not wrapped in `useMemo`, so every call produced a fresh reference
2. This busted `useCurrentModelEnvironment()`'s `useMemo` → new `currentMiroirModelEnvironment` reference
3. Which busted `jzodTypeCheckResult` `useMemo` in `TypedValueObjectEditor` → new result with new `keyMap`
4. The `useEffect` fired → called `context.setTypeCheckKeyMap(newKeyMap)` → updated `typeCheckKeyMap` state in `DocumentOutlineContext`
5. `ReportSectionEntityInstance` (a `DocumentOutlineContext` consumer) re-rendered → `TypedValueObjectEditor` re-rendered as child → **back to step 1**

Additionally, `Object.keys(applicationDeploymentMap)` created a new array every render, further preventing memoization.

**Three fixes applied:**

- **ReduxHooks.ts**: Wrapped `useEndpointsOfApplications` and `useMenusOfApplications` computations in `useMemo`. Memoized `Object.keys(applicationDeploymentMap)` in `useCurrentModelEnvironment`.
- **TypedValueObjectEditor.tsx**: Added a `useRef` guard so `context.setTypeCheckKeyMap` is only called when the `keyMap` reference actually changes, as a safety net against any remaining unstable references.

Made changes.