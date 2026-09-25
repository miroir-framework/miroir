# Report API Reference (⚠️SLOPPY⚠️)

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Reports** define how data is displayed in the UI using declarative JSON. Reports combine queries, transformers, and UI sections.

---

## Schema Location

`packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json` (the `mlSchema` of the `Report` Entity; a historical snapshot `952d2c65-…` exists in `miroir_modelVersion/`)

---

## Report Structure

```json
{
  "uuid": "report-uuid",
  "parentUuid": "952d2c65-4da2-45c2-9394-a0920ceedfb6",
  "name": "BookListReport",
  "defaultLabel": "Book List",
  "type": "list",
  "definition": {
    "extractorTemplates": {
      "books": {
        "queryType": "queryExtractObjectListByEntity",
        "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
      }
    },
    "section": {
      "type": "objectListReportSection",
      "definition": {
        "label": "Books",
        "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        "fetchedDataReference": "books"
      }
    }
  }
}
```

---

## Report Section Types

### 1. Object List Section

Display a list of entity instances:

```json
{
  "type": "objectListReportSection",
  "definition": {
    "label": "Books",
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "fetchedDataReference": "books",
    "sortByAttribute": "title"
  }
}
```

### 2. Grid Section

**Coming Soon**

### 3. Multistep Report

A Report with `"type": "multistep"` pages its `list` children one step at a time (Back / Next / Finish / Cancel). There is no Form entity. A step is any `ReportSection`. **General edit mode** still pages the preview; the **Report Editor** (`InlineReportEditor`) appears above the walk when you open a Report model instance, same as other reports.

Finish on the last step runs `definition.compositeActionSequence` (`CompositeActionSequenceTemplate`) through `handleCompositeActionTemplate`. The payload is the **step bag** (`inputPrefix` buckets plus hoisted `objectInstanceReportSection` path keys), not the raw Formik tree. The walk is memory-only; the URL has no `step` key.

A list child is either a bare section or an envelope `{ stepId, section, onNext?, branch?, inputSchemaFromBag? }`. Bare sections stay linear: Back is the previous index and Finish gates every child. When any child has a `stepId`, Back pops the steps actually visited and Finish gates only those steps. Next checks the resolved input schema, runs optional `onNext`, merges that result under `stepId`, then follows `branch.whenTrue` or `branch.whenFalse`. A failed `onNext` or branch test stays on the current step and shows that failure's own message. `inputSchemaFromBag` is evaluated when the step opens. It is not written into `inputMLSchema`.

Optional Report `description` (multiline string on the Report entity) is shown on **step 0** above the step label in `MultistepReportHost` (`data-testid="multistep-report-description"`).

```json
{
  "type": "multistep",
  "definition": {
    "compositeActionSequence": { "actionType": "compositeActionSequence", "payload": { "actionSequence": [] } },
    "section": {
      "type": "list",
      "definition": [
        { "type": "inputReportSection", "definition": { "label": "Country", "inputPrefix": "stepOne" } }
      ]
    }
  }
}
```

Launchers (they do not collect Finish parameters):

- `openReportSection` — page-level button (`openAs`: `"modal"` or `"route"`).
- `objectListReportSection.definition.openReport` — per-row tools button; the row PK is passed as `pageParams.instanceUuid`.

```json
{
  "type": "openReportSection",
  "definition": {
    "label": "Create country",
    "reportUuid": "d2b2fbbd-6844-4422-8412-4e3c303296bc",
    "openAs": "modal"
  }
}
```

### 4. Composite Section

Combine multiple sections:

```json
{
  "type": "list",
  "definition": [
    {
      "type": "objectListReportSection",
      "definition": { /* ... */ }
    },
    {
      "type": "grid",
      "definition": { /* ... */ }
    }
  ]
}
```

---

## Complete Report Type Reference

**Coming Soon**: Auto-generated from Jzod schemas

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
