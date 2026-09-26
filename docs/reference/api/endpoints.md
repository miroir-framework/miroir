# Endpoint API Reference (⚠️SLOPPY⚠️)

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Endpoints** define service interfaces that expose Actions to clients.

---

## Schema Location

`packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3d8da4d4-8f76-4bb4-9212-14869d81c00c.json` (the `mlSchema` of the `Endpoint` Entity)

---

## Endpoint Types

### 1. Instance Endpoint

CRUD operations on entity instances:

```json
{
  "uuid": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "parentUuid": "e3c1cc69-066d-4f52-beeb-b659dc7a88b9",
  "name": "InstanceEndpoint",
  "defaultLabel": "Instance CRUD Operations",
  "definition": {
    "actionType": "instanceAction"
  }
}
```

### 2. Model Endpoint

Operations on application model:

```json
{
  "uuid": "7947ae40-eb34-4149-887b-15a9021e714e",
  "parentUuid": "e3c1cc69-066d-4f52-beeb-b659dc7a88b9",
  "name": "ModelEndpoint",
  "defaultLabel": "Model Operations",
  "definition": {
    "actionType": "modelAction"
  }
}
```

### 3. Query Endpoint

Execute queries:

**Coming Soon**

### 4. Custom Endpoint

Domain-specific operations:

**Coming Soon**

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
