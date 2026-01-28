# Report API Reference

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Reports** define how data is displayed in the UI using declarative JSON. Reports combine queries, transformers, and UI sections.

---

## Schema Location

`packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json`

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

### 3. Form Section

**Coming Soon**

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
