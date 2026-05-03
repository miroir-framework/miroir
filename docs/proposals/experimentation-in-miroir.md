# Experimentation in Miroir: 5 Proposed Improvements

The [library tutorial](../tutorials/library-tutorial.md) demonstrates Miroir's edition
capabilities well, but reveals a significant friction: each task — adding an attribute,
writing a query, building a transformer, defining an action — requires the user to produce
a correct JSON definition from the start. There is no feedback loop before commitment, and
there is no safe space to try something wrong and learn from it. This document proposes
five concrete improvements that would lower that barrier.

---

## 1. Query Live Preview

### Problem

Today, testing a query requires three sequential committed actions:

1. Save the Query instance (via the Queries list, with the full JSON).
2. Create (or modify) a Report that references the query by uuid.
3. Navigate to the Report to see whether the query returns the expected data.

In the library tutorial, when building `Book_Without_ISBN`, the user must write the entire
extractor + combiner + transformer chain in one shot:

```json
{
  "uuid": "df972710-31ac-4dbe-a114-c0f4cc67e335",
  "name": "Book_Without_ISBN",
  "extractors": {
    "books": { "extractorType": "instancesForEntity", "entityUuid": "e8ba151b-..." }
  },
  "combiners": {},
  "transformers": {
    "booksWithoutISBN": {
      "transformerType": "listPickElement",
      "referencedExtractor": "books",
      "filter": { "attributeName": "ISBN", "value": { "transformerType": "constantUndefined" } }
    }
  }
}
```

If any field name is wrong — for example, `listPickElement` instead of `listFilter`, or a
wrong entity uuid — the user discovers the error only after the detour through Report
creation.

### Proposed improvement: Preview button on the Query edit form

Add a **Preview** button to the Query edit form (the `JzodElementEditor` surface that
already exists for queries in Design Mode). Clicking it would:

1. Collect the current (unsaved) query JSON from the form.
2. Execute it in-memory through the existing `QuerySelectors` path, using the current
   deployment's store.
3. Display the result in a collapsible panel below the form, formatted as a compact
   entity-instance list.

The underlying execution path (`boxedQueryWithExtractorCombinerTransformer` + the
existing selector stack) is already available on the client. No new server endpoint is
needed. This is essentially the same mechanism already used by the
`TransformationResultPanel` in `TransformerBuilderPage` — it only needs to be wired to
the query editor form.

**Expected impact**: the `Book_Without_ISBN` query could be iteratively refined in seconds
instead of minutes, with full visibility into intermediate results before the Query is
ever persisted.

---

## 2. Schema Mutation Impact Preview

### Problem

The tutorial's most dangerous moment is adding the `ISBN` attribute to the `Book`
EntityDefinition. The tutorial warns in bold: *"remember to declare it optional, because
the existing Books do not have a value for it yet, and the structure check for them would
otherwise fail!"*

This is precisely the kind of error a first-time user will make. If they forget the
`optional: true` flag:

```json
{
  "type": "object",
  "definition": {
    "...": "...(existing attributes)",
    "ISBN": { "type": "string" }   ←  missing  "optional": true
  }
}
```

the form is submitted, the EntityDefinition is saved, and downstream errors appear — not
immediately here, but later when Miroir tries to validate existing Book instances against
the new schema and finds that all 48 books are now structurally invalid.

### Proposed improvement: Pre-save validation report

Before persisting an EntityDefinition change, run the new `mlSchema` against all existing
instances of that Entity (client-side, using the local cache) and display a summary:

```
EntityDefinition change preview for Book
─────────────────────────────────────────
✓  0 instances satisfy the new schema
✗  48 instances would FAIL validation:
     "Clean Code" (uuid: a1b2…) — missing required field "ISBN"
     "The Pragmatic Programmer" (uuid: c3d4…) — missing required field "ISBN"
     … (46 more)

Proceed anyway?   [Cancel]  [Save]
```

This requires:
- Retrieving all Book instances from the local Redux cache (already done for list reports).
- Running the candidate Jzod schema through the existing Zod validator path
  (`JzodToZod.ts` in the `jzod` package) against each instance.
- Displaying the results before the model action is dispatched.

No save happens until the user explicitly confirms. The check is purely local and
non-destructive.

**Expected impact**: the `optional` trap becomes impossible to fall into silently. The
user sees the effect of their schema change before it is committed, and the warning
message becomes actionable rather than advisory.

---

## 3. Transformer Step-Through

### Problem

`TransformerBuilderPage` already shows live output for a transformer, which is a
significant advantage. However, for composed transformers — those built from nested calls
or from a `dataflowSequence` — the page shows only the **final** result. When a composed
transformer goes wrong, there is no way to see which step produced unexpected data.

Consider a transformer that should list books missing an ISBN, sorted by year:

```json
{
  "transformerType": "dataflowSequence",
  "definition": [
    {
      "resultName": "allBooks",
      "transformerType": "listReferenceByUuid",
      "referencedExtractor": "books"
    },
    {
      "resultName": "booksWithoutISBN",
      "transformerType": "listFilter",
      "referencedExtractor": "allBooks",
      "filter": { "attributeName": "ISBN", "value": { "transformerType": "constantUndefined" } }
    },
    {
      "resultName": "sortedByYear",
      "transformerType": "listSortBy",
      "referencedExtractor": "booksWithoutISBN",
      "sortBy": "year"
    }
  ]
}
```

If `booksWithoutISBN` is empty because the filter attribute name is misspelled
(`"ISBN"` vs `"isbn"`), the final output is empty and the user has no immediate
indication of which step failed.

### Proposed improvement: Named-step intermediate result display

The `TransformerEventsPanel` already exists and captures transformer execution events.
Extend `TransformationResultPanel` to display intermediate named results from a
`dataflowSequence` step-by-step, in a collapsible accordion:

```
▼ Step 1: allBooks          → 48 items  ✓
▼ Step 2: booksWithoutISBN  →  0 items  ⚠  (48 items did not match filter)
  Filter attribute: "ISBN" — no instance has this attribute (did you mean "isbn"?)
▼ Step 3: sortedByYear      →  0 items  (cascaded from step 2)
```

The transformer runner already records per-step results internally. Surfacing them in the
UI requires adding a `steps` array to `TransformerReturnType` (or to the event log) and
rendering it in the panel. The attribute-name hint ("did you mean…?") can be generated by
inspecting the keys of the first item in the input list.

**Expected impact**: debugging a composed transformer is reduced from a trial-and-error
exercise across multiple form saves to an immediate visual diagnosis.

---

## 4. Action Diff Preview (Pre-commit Change Summary)

### Problem

Miroir model actions — adding an attribute, renaming an entity, creating a query,
deploying an endpoint — are committed in one step. The framework already maintains an
undo/redo stack (the Redux `undoableReducer` in `miroir-localcache-redux`), so the
concept of "pending state" exists. However, the user has no view into what a model action
will do before they click the validation button.

In Part 4 of the library tutorial, the user creates a `Books` Endpoint with an
`updateISBN` Action by pasting ~80 lines of JSON. If a field is wrong — a mistyped
`actionType` literal, a wrong entity uuid in the `payload` schema — the action is saved
silently and the error surfaces only when the Runner is invoked.

### Proposed improvement: Pending-changes diff panel

After editing any model instance in Design Mode (EntityDefinition, Query, Endpoint, ...)
but before pressing **Validate**, display a collapsible diff panel showing the difference
between the current persisted state and the about-to-be-saved state:

```
Pending change: update EntityDefinition "Book"
───────────────────────────────────────────────
  mlSchema.definition:
+   "ISBN": { "type": "string", "optional": true }

  No other fields changed.
```

```
Pending change: create Endpoint "Books"
────────────────────────────────────────
+ definition.actions[0].actionParameters.actionType = "updateISBN"
+ definition.actions[0].actionParameters.payload.book  (type: uuid → Book)
+ definition.actions[0].actionParameters.payload.ISBN  (type: string, optional)
```

The diff can be computed client-side using a recursive object-diff against the current
Redux cache state. A JSON-patch (`json-diff` or similar) library produces the delta; the
panel renders it with color-coded additions and removals.

Because the undo stack is already there, adding an **Undo last model change** shortcut on
the Design Mode toolbar becomes trivial in the same work batch.

**Expected impact**: users verify intent before committing. Wrong uuid references in
action payload schemas are caught before the Runner is built, collapsing a multi-step
debug cycle into a single review step.

---

## 5. Report Scratch-Pad (Unsaved Preview)

### Problem

Creating a Report today is an all-or-nothing operation. The user must:

1. Write the full Report JSON (sections, query reference, display columns).
2. Save it as a Report instance.
3. Navigate to the Report to see whether it renders correctly.

There is no way to sketch a report, see it with real data, iterate, and only save it when
it looks right. In the tutorial, the `Book_Without_ISBN_Report` is pasted in one shot.
If the column heading or the query reference uuid is wrong, the user must re-open the
Report definition and re-save.

### Proposed improvement: Report Scratch-Pad page

Add a **Report Scratch-Pad** accessible from Design Mode. It renders a Report definition
from a local (unsaved) JSON editor, executing its embedded or referenced Query in
real-time and displaying the result exactly as a saved Report would — without creating
any Report instance.

The scratch-pad would reuse:
- The existing `JzodElementEditor` for editing the Report JSON.
- The existing `ReportPage` rendering pipeline (`ReportSectionEntityInstance`,
  `ReportSectionListDisplay`, etc.) fed with the local definition instead of a persisted
  one.
- The existing query execution path to resolve the data.

A **Save as Report** button at the bottom would, once the user is satisfied, persist the
current scratch definition as a new Report instance.

```
[ Report Scratch-Pad ]
┌─────────────────────────────────────────────────────┐
│  Definition (edit here)           │  Live Preview   │
│  ┌───────────────────────────┐    │  ─────────────  │
│  │ { "type": "report", ...  │    │  Book Title  Yr │
│  │   "sections": [...]       │    │  ─────────────  │
│  │ }                         │    │  Domain-Driven… │
│  └───────────────────────────┘    │  Clean Code     │
│                                   │  (no ISBN yet)  │
└─────────────────────────────────────────────────────┘
                              [ Save as Report ]
```

**Expected impact**: the Report creation experience becomes iterative and visual. A user
who wants to tweak the column order or add a computed column can see the effect
immediately, without polluting the Report catalogue with intermediate drafts. This is
the biggest single quality-of-life gap identified in the tutorial walk-through.

---

## Summary

| # | Improvement | Requires new infra? | Reuses existing code | Difficulty |
|---|-------------|--------------------|-----------------------|------------|
| 1 | Query Live Preview | No | QuerySelectors, TransformationResultPanel | Low |
| 2 | Schema Mutation Impact Preview | No | JzodToZod, local Redux cache | Medium |
| 3 | Transformer Step-Through | Minor (steps in return type) | TransformerEventsPanel, dataflowSequence | Medium |
| 4 | Action Diff Preview | No | undoableReducer, JSON-patch | Medium |
| 5 | Report Scratch-Pad | No | ReportPage, JzodElementEditor | High |

All five improvements share a common principle: **show the effect of a change before
it is committed**. They do not require new backend services — the data and execution
engines are already present on the client. The work is entirely in surfacing existing
intermediate state in the UI, which fits naturally into Miroir's declarative,
schema-first philosophy.
