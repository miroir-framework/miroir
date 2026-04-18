All fixes verified with no compile errors. Here's the full analysis:

---

## Root Cause & Fix

**The loop mechanism:**

1. User edits `editedQueryParameterValue` via `TypedValueObjectEditor` → Formik calls `setFieldValue(editedQueryParameterValueKey, newValue)`  
2. Formik creates a new `values` object (shallow copy) with the new value  
3. `instance` in `ReportSectionEntityInstance` was `useMemo`'d on `formikContext.values` (entire object), so got a **new reference** even though `values[formikValuePathAsString]` (the entity data) hadn't changed  
4. `useEffect([..., instance, ...])` fired → `outlineContext.setReportInstance(instance)` with new ref  
5. `DocumentOutlineContextProvider` state updated → `outlineContextValue` is new → **all consumers** of `DocumentOutlineContext` re-rendered, including `ReportViewWithEditor`  
6. Back to step 1 (15 renders/second continuously)

**Fixes applied:**

1. **[Primary fix — `ReportSectionEntityInstance.tsx`]** Removed the `useMemo` for `instance` and directly access `formikContext.values[formikValuePathAsString]`. Since Formik's `setFieldValue` does a shallow copy of `values`, the property at `formikValuePathAsString` retains its original reference when an unrelated key (`editedQueryParameterValue`) is changed. This breaks the loop.

2. **[`ReportHooks.ts`]** Added missing `query` dependency to the `reportDataQuery` `useMemo`, which previously could return a stale query when navigating between reports.

3. **[`ReportTools.ts`]** Removed stray `import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js"`.

4. **[`ReportViewWithEditor.tsx`]** Removed unused `editedQueryParameterValueKey` import.

---

## Analysis of other potential refresh improvements

| Issue | Impact | Effort |
|---|---|---|
| **`initialReportSectionsFormValue` resets `editedQueryParameterValue`** when `reportData` changes (Formik `enableReinitialize`): user's edited query params get wiped. Use a `useRef` to preserve current param values or manage them outside Formik. | Medium (UX) | Medium |
| **`setReportInstance` called with deep-equal but new-reference instance** after Formik reinit: one spurious outlineContext update per reinit. Use deep-equal check before calling `setReportInstance`. | Low | Low |
| **`applicationDeploymentMap` captured in `useSelector` closure** in `useReduxDeploymentsStateQueryTemplateSelector`/`useReduxDeploymentsStateQuerySelector`: if the deployment map is a new reference, reselect misses its cache. Memoize the deployment map passed to these hooks. | Low-Medium | Low |
| **`queryForTestRun` runs on every `isResultsCollapsed` change** (when the Results section is expanded/collapsed): consider lazy initialization of `queryTestRunParams` only when results are expanded. | Low | Low | 


-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------

"refined" analysis

Here's the full analysis and what was done:

---

## Root Cause (refined analysis)

The loop has two layers:

**Layer 1 — `setReportInstance` cascade** (the actual loop driver):
1. `ReportSectionEntityInstance` renders → `instance = formikContext.values[formikValuePathAsString]` gets a **new reference** (Formik reinit from new `initialReportSectionsFormValue`)
2. `useEffect([..., instance, ...])` fires → `setReportInstance(newInstance)` called
3. `DocumentOutlineContextProvider` state changes → `outlineContextValue` new object
4. `ReportViewWithEditor` (a consumer via `useDocumentOutlineContext()`) re-renders
5. → back to step 1

**Layer 2 — Why does `instance` keep getting a new reference?**

The query selector logs appearing between **every pair of renders** is the smoking gun: the `createSelector` cache ALWAYS misses. This means one of its inputs changes every render. The diagnostic logs added to ReportHooks.ts will reveal exactly which input changes (`reportDataQuery` reference → `foreignKeyParams` → selector cache miss → new `reportData` reference → Formik reinit → new `instance` reference).

## Fixes Applied

| Fix | Location | What it does |
|---|---|---|
| **UUID guard on `setReportInstance`** | ReportSectionEntityInstance.tsx | Breaks the cascade loop: `setReportInstance` is only called when the instance UUID **actually changes** (navigation to a different entity), not on spurious reference changes from Formik reinit |
| **Diagnostic: instance ref change** | ReportSectionEntityInstance.tsx | Logs when `instance` reference changes between renders, with UUID comparison info |
| **Diagnostic: selector inputs** | ReportHooks.ts | Logs `LOOP DIAGNOSTIC` when `foreignKeyParams`/`appMap` reference changes (pinpoints why selector cache misses) |
| **Diagnostic: reportData ref change** | ReportHooks.ts | Logs when `reportData` reference changes between renders (confirms layer 2) |

The UUID guard is the **protective fix** — it stops the loop regardless of whether layer 2 is resolved. The `LOOP DIAGNOSTIC` logs will tell us in the next round exactly which selector input is unstable, to apply the root-cause fix. 

-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------
-----------

## verdict

third analysis pointed to the source of the issue, but only in-passing, in the chain-of-thought display, then moving to other considerations, and was thus interrupted. It is not known whether this iteration or any posterior iteration would have indeed established this cause as the root cause for the issue, and corrected it.

There was a remainder from a previous, ill-fated attempt to share the typecheck results among the JzodEditor components. This lead to a refresh of the whole page tree, and thus lead to the problem. Removing that fixed the issue, in the `TypedValueObjectEditorInner`:

```js
 // extruding typeCheckKeyMap to context for Outline usage
  const previousKeyMapRef = useRef<Record<string, any> | undefined>(undefined);
  useEffect(() => {
    if (
      jzodTypeCheckResult &&
      jzodTypeCheckResult.status == "ok" &&
      jzodTypeCheckResult.keyMap &&
      jzodTypeCheckResult.keyMap !== previousKeyMapRef.current
    ) {
      previousKeyMapRef.current = jzodTypeCheckResult.keyMap;
      if (context.setTypeCheckKeyMap) {
        context.setTypeCheckKeyMap(jzodTypeCheckResult.keyMap);
      } else {
        log.warn(
          "TypedValueObjectEditor context.setTypeCheckKeyMap is undefined, cannot set typeCheckKeyMap"
        );
      }
    }
  }, [jzodTypeCheckResult]);
```
